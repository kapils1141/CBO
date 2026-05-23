import {
    Config,
    FRAuth,
    FRStep,
    FRUser,
    TokenManager,
    UserManager,
} from '@forgerock/javascript-sdk';

export const initForgeRock = () => {
    Config.set({
        serverConfig: {
            baseUrl: 'https://cbonline.lloyds.com:3000/openam',
            timeout: 10000,
        },
        realmPath: 'commercial-banking',
        clientId: 'WebMerchantApp',
        redirectUri: 'https://cbonline.lloyds.com:3000/callback',
        scope: 'openid profile email',
        tree: 'Login',
    });
};

export const forgerockService = {
    async login(username?: string, password?: string) {
        try {
            const step = await FRAuth.next();
            if (step.type !== 'Step') {
                return step;
            }
            step.callbacks.forEach((callback: any) => {
                if (callback.getType() === 'NameCallback' && username) {
                    callback.setName(username);
                }
                if (callback.getType() === 'PasswordCallback' && password) {
                    callback.setPassword(password);
                }
            });
            return await FRAuth.next(step as FRStep);
        } catch (err) {
            console.error('ForgeRock Login Error:', err);
            throw err;
        }
    },

    async submitStep(step: FRStep) {
        try {
            return await FRAuth.next(step);
        } catch (err) {
            console.error('ForgeRock Step Submission Error:', err);
            throw err;
        }
    },

    async getUserInfo() {
        try {
            // Read from localStorage — never call TokenManager.getTokens()
            // which triggers getAuthCodeByIframe and causes redirect loops
            const stored = localStorage.getItem('FR-SDK-WebMerchantApp');
            if (!stored) throw new Error('No tokens in storage');
            const tokens = JSON.parse(stored);
            if (!tokens?.accessToken) throw new Error('No access token');

            const user: any = await UserManager.getCurrentUser();
            return {
                userId: user.sub,
                username: user.preferred_username || user.name,
                firstName: user.given_name,
                lastName: user.family_name,
                createdOn: user.created_at,
                updatedOn: new Date().toISOString(),
                userStatus: 'ACTIVE',
                userRole: user.roles?.[0] || 'USER',
            };
        } catch (err) {
            console.error('Failed to get user info:', err);
            return null;
        }
    },

    async logoutSilent(): Promise<void> {
        try {
            await FRUser.logout();
        } catch (err) {
            // Ignore — session may already be expired or not exist
        }
    },

    async logout(): Promise<void> {
        try {
            await FRUser.logout();
        } catch (err) {
            // Ignore errors
        } finally {
            window.location.href = 'https://cbonline.lloyds.com:3000/PrimaryAuth';
        }
    },

    async getAccessToken(): Promise<string | null> {
        try {
            // Read directly from localStorage — no SDK call that could trigger redirect
            const stored = localStorage.getItem('FR-SDK-WebMerchantApp');
            if (stored) {
                const tokens = JSON.parse(stored);
                if (tokens?.accessToken) {
                    return tokens.accessToken;
                }
            }
            return null;
        } catch (err) {
            console.error('getAccessToken failed:', err);
            return null;
        }
    },

    async getAuthHeaders(): Promise<Record<string, string>> {
        const token = await forgerockService.getAccessToken();
        if (token) {
            return { Authorization: `Bearer ${token}` };
        }
        return {};
    },

    async isSystemOnline(): Promise<boolean> {
        try {
            const response = await fetch(
                'https://cbonline.lloyds.com:3000/openam/json/serverinfo/*',
                {
                    method: 'GET',
                    mode: 'cors',
                }
            );
            return response.status === 200 || response.status === 401;
        } catch (err) {
            console.warn('ForgeRock server unreachable:', err);
            return false;
        }
    },
};