import getValidAccessToken from "./getValidAccessToken.js";
import { spotifyApi } from "../../index.js";

// Function to get user's currently playing track
async function getCurrentlyPlaying(userId) {
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
async function getTopTracks(userId, timeRange = 'medium_term', limit = 10) {
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
async function getTopArtists(userId, timeRange = 'medium_term', limit = 10) {
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