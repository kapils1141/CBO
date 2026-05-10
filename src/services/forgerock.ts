import { Config, FRAuth, TokenManager, UserManager } from '@forgerock/javascript-sdk';

/**
 * ForgeRock Service Configuration
 * In a real application, these values should be moved to .env or a config file.
 */
export const initForgeRock = () => {
    Config.set({
        serverConfig: {
            baseUrl: 'https://openam-lloyds.forgerock.io/am', // Replace with your ForgeRock AM URL
            timeout: 10000,
        },
        realmPath: 'root',
        clientId: 'WebMerchantApp',
        redirectUri: window.location.origin + '/callback',
        scope: 'openid profile email',
    });
};

export const forgerockService = {
    /**
     * Start the authentication flow
     */
    async login(username?: string, password?: string) {
        try {
            // This initiates/continues the ForgeRock authentication tree
            const step = await FRAuth.next();
            
            // If the tree requires username/password, we can pre-fill if provided
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

    /**
     * Get the authenticated user's details
     * This demonstrates the user schema requested
     */
    async getUserInfo() {
        try {
            const tokens = await TokenManager.getTokens();
            if (!tokens) throw new Error('No active session');
            
            const user = await UserManager.getCurrentUser();
            
            // Map ForgeRock attributes to your requested schema
            return {
                userId: user.sub,
                username: user.preferred_username || user.name,
                firstName: user.given_name,
                lastName: user.family_name,
                createdOn: user.created_at, // Map from internal metadata if available
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

    /**
     * Check if the ForgeRock server is reachable
     */
    async isSystemOnline(): Promise<boolean> {
        try {
            // Check if we can reach the info endpoint or similar
            const response = await fetch('https://openam-lloyds.forgerock.io/am/serverinfo/*', {
                method: 'GET',
                mode: 'cors',
            });
            return response.ok;
        } catch (err) {
            console.warn('ForgeRock server unreachable:', err);
            return false;
        }
    }
};
