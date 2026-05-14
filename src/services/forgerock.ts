import {
    Config,
    FRAuth,
    FRStep,
    TokenManager,
    UserManager,
} from '@forgerock/javascript-sdk';

export const initForgeRock = () => {
    Config.set({
        serverConfig: {
            baseUrl: 'http://openam.lloyds.com:8080/openam',
            timeout: 10000,
        },
        realmPath: 'commercial-banking',
        clientId: 'WebMerchantApp',
        redirectUri: 'http://cbonline.lloyds.com:3000/callback',
        scope: 'openid profile email',
        tree: 'Login',
    });
};

export const forgerockService = {
    async login(username?: string, password?: string) {
        try {
            // Step 1 - Start authentication journey
            const step = await FRAuth.next();

            // Ensure this is an authentication step
            if (step.type !== 'Step') {
                return step;
            }

            // Step 2 - Populate username/password callbacks
            step.callbacks.forEach((callback: any) => {
                if (callback.getType() === 'NameCallback' && username) {
                    callback.setName(username);
                }

                if (callback.getType() === 'PasswordCallback' && password) {
                    callback.setPassword(password);
                }
            });

            // Step 3 - Submit credentials
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
            const tokens = await TokenManager.getTokens();

            if (!tokens) {
                throw new Error('No active session');
            }

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

    async logout() {
        try {
            // Clear browser storage
            sessionStorage.clear();
            localStorage.clear();

            // Redirect to AM logout
            window.location.href =
                'http://openam.lloyds.com:8080/openam/XUI/#logout/';
        } catch (err) {
            console.error('Logout failed:', err);
        }
    },

    async isSystemOnline(): Promise<boolean> {
        try {
            const response = await fetch(
                'http://openam.lloyds.com:8080/openam/json/serverinfo/*',
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