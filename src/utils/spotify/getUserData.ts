import { spotifyApi } from "../../index.js";

/**
 * Function to get user's currently playing track
 * @param {string} accessToken 
 * @returns {Promise<SpotifyApi.CurrentlyPlayingResponse>} currently playing track
 * @throws {Error} if error getting currently playing track
 */
async function getCurrentlyPlaying(accessToken: string): Promise<SpotifyApi.CurrentlyPlayingResponse> {
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyCurrentPlayingTrack();
        return data.body;
    } catch (error) {
        console.error('Error getting currently playing track:', error);
        throw error;
    }
}

/**
 * Function to get user's top tracks
 * @param {string} accessToken 
 * @param {string} timeRange 
 * @param {number} limit 
 * @returns {Promise<SpotifyApi.UsersTopTracksResponse>} top tracks
 * @throws {Error} if error getting top tracks
 */
async function getTopTracks(accessToken: string, timeRange: "long_term" | "medium_term" | "short_term" = "medium_term", limit: number = 10): Promise<SpotifyApi.UsersTopTracksResponse> {
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyTopTracks({ 
            time_range: timeRange, 
            limit: limit 
        });
        return data.body;
    } catch (error) {
        console.error('Error getting top tracks:', error);
        throw error;
    }
}

/**
 * Function to get user's top artists
 * @param {string} accessToken 
 * @param {string} timeRange 
 * @param {number} limit 
 * @returns {Promise<SpotifyApi.UsersTopArtistsResponse>} top artists
 * @throws {Error} if error getting top artists
 */
async function getTopArtists(accessToken: string, timeRange: "long_term" | "medium_term" | "short_term" = "medium_term", limit: number = 10): Promise<SpotifyApi.UsersTopArtistsResponse> {
    try {
        spotifyApi.setAccessToken(accessToken);
        const data = await spotifyApi.getMyTopArtists({ 
            time_range: timeRange, 
            limit: limit 
        });
        return data.body;
    } catch (error) {
        console.error('Error getting top artists:', error);
        throw error;
    }
}

export { getCurrentlyPlaying, getTopArtists, getTopTracks };