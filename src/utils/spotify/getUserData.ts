import getValidAccessToken from "./getValidAccessToken.js";
import { spotifyApi } from "../../index.js";

/**
 * Function to get user's currently playing track
 * @param {string} userId 
 * @returns data.body if successful, null otherwise
 */
async function getCurrentlyPlaying(userId: string) {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return null;
    
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        return data.body;
    } catch (error) {
        console.error('Error getting currently playing track:', error);
        return null;
    }
}

// Function to get user's top tracks
async function getTopTracks(userId: string, timeRange: "long_term" | "medium_term" | "short_term" = "medium_term", limit = 10) {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return null;
    
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyTopTracks({ 
            time_range: timeRange, 
            limit: limit 
        });
        return data.body;
    } catch (error) {
        console.error('Error getting top tracks:', error);
        return null;
    }
}

// Function to get user's top artists
async function getTopArtists(userId: string, timeRange: "long_term" | "medium_term" | "short_term" = "medium_term", limit = 10) {
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) return null;
    
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyTopArtists({ 
            time_range: timeRange, 
            limit: limit 
        });
        return data.body;
    } catch (error) {
        console.error('Error getting top artists:', error);
        return null;
    }
}

export {getCurrentlyPlaying, getTopArtists, getTopTracks };