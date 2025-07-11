import { spotifyApi, userTokens } from "../../index.js";

/**
 * Function to refresh expired tokens
 * @param {string} userId 
 * @returns {boolean} success
 */
async function refreshUserToken(userId: string): Promise<boolean> {
    const userToken = userTokens.get(userId);
    if (!userToken || !userToken.refreshToken) return false;
    
    try {
        spotifyApi.setRefreshToken(userToken.refreshToken);
        const data = await spotifyApi.refreshAccessToken();
        const { access_token, expires_in } = data.body;
        
        userTokens.set(userId, {
            ...userToken,
            accessToken: access_token,
            expiresAt: Date.now() + (expires_in * 1000)
        });
        
        return true;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return false;
    }
}

/**
 * Function to get valid access token for user
 * @param {string} userId 
 * @returns {string | null} accessToken or null on failure
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
    const userToken = userTokens.get(userId);
    if (!userToken) return null;
    
    // Check if token is expired
    if (Date.now() >= userToken.expiresAt) {
        const refreshed = await refreshUserToken(userId);
        if (!refreshed) return null;
    }
    
    return userTokens.get(userId)?.accessToken ?? null;
}

export default getValidAccessToken;