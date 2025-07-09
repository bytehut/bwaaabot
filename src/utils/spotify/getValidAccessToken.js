import { userTokens } from "../../index.js";

// Function to refresh expired tokens
async function refreshUserToken(userId) {
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

// Function to get valid access token for user
async function getValidAccessToken(userId) {
    const userToken = userTokens.get(userId);
    if (!userToken) return null;
    
    // Check if token is expired
    if (Date.now() >= userToken.expiresAt) {
        const refreshed = await refreshUserToken(userId);
        if (!refreshed) return null;
    }
    
    return userTokens.get(userId).accessToken;
}

export default getValidAccessToken;