import { spotifyApi } from "../../index.js";
import { SpotifyToken, SpotifyTokenService } from "../../database/index.js";

const EXPIRATION_BUFFER = 60;

const tokenService = new SpotifyTokenService();

/**
 * Function to refresh expired tokens. Updates token in database.
 * @param {string} userId 
 * @returns {Promise<SpotifyToken | null>} refreshed token
 * @throws {Error} if error refreshing token
 */
async function refreshUserToken(userId: string): Promise<SpotifyToken | null> {
    try {
        const userToken = await tokenService.getToken(userId);
        if (!userToken) return null;
    
        spotifyApi.setRefreshToken(userToken.refreshToken);
        const data = await spotifyApi.refreshAccessToken();
        const { access_token, refresh_token, expires_in } = data.body;
        
        await setToken(userId, access_token, refresh_token ?? userToken.refreshToken, expires_in);
        
        return {
            userId: userId,
            accessToken: access_token,
            refreshToken: refresh_token ?? userToken.refreshToken,
            expiration: Date.now() + ((expires_in - EXPIRATION_BUFFER) * 1000)
        } as SpotifyToken;
    } catch (error) {
        console.error('Error refreshing token:', error);
        throw error;
    }
}

/**
 * Function to get valid access token for user. Handles token refresh if needed.
 * Returns null if no token found.
 * @param {string} userId 
 * @returns {Promise<string | null>} accessToken or null if no token found
 * @throws {Error} if error getting token
 */
async function getValidAccessToken(userId: string): Promise<string | null> {
    try {
        let userToken = await tokenService.getToken(userId);
    
        // Check if token is expired
        if (userToken && Date.now() >= userToken.expiration) {
            userToken = await refreshUserToken(userId);
        }
        
        if (!userToken) return null;
        return userToken.accessToken;
    } catch (error) {
        console.error('Error getting valid access token:', error);
        throw error;
    }
}


/**
 * Function to set token for user, with automatic expiration buffer.
 * @param userId 
 * @param access_token 
 * @param refresh_token 
 * @param expires_in 
 * @throws {Error} if error setting token
 */
async function setToken(userId: string, access_token: string, refresh_token: string, expires_in: number) {
    // Store user tokens
    let token: SpotifyToken = {
        userId: userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiration: Date.now() + ((expires_in - EXPIRATION_BUFFER) * 1000)
    };
    try {
        await tokenService.setToken(token);
    } catch (error) {
        console.error('Error setting token:', error);
        throw error;
    }
}

export { getValidAccessToken, setToken };