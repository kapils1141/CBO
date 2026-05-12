import { Config, FRAuth, TokenManager, UserManager } from '@forgerock/javascript-sdk';

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
            const step = await FRAuth.next();

            if (step.getCallbacks().length > 0) {
                if (username) step.getCallbackOfType('NameCallback').setName(username);
                if (password) step.getCallbackOfType('PasswordCallback').setPassword(password);
                return await FRAuth.next(step);
            }
            return step;
        } catch (err) {
            console.error('ForgeRock Login Error:', err);
            throw err;
        }
    },

    async getUserInfo() {
        try {
            const tokens = await TokenManager.getTokens();
            if (!tokens) throw new Error('No active session');

            const user = await UserManager.getCurrentUser();

            return {
                userId: user.sub,
                username: user.preferred_username || user.name,
                firstName: user.given_name,
                lastName: user.family_name,
                createdOn: user.created_at,
                updatedOn: new Date().toISOString(),
                userStatus: 'ACTIVE',
                userRole: user.roles?.[0] || 'USER'
            };
        } catch (err) {
            console.error('Failed to get user info:', err);
            return null;
        }
    },

    logout() {
        return FRAuth.logout();
    },

    async isSystemOnline(): Promise<boolean> {
        try {
            const response = await fetch(
                'http://openam.lloyds.com:8080/openam/json/serverinfo/*',
                { method: 'GET', mode: 'cors' }
            );
            return response.status === 200 || response.status === 401;
        } catch (err) {
            console.warn('ForgeRock server unreachable:', err);
            return false;
        }
    }
};