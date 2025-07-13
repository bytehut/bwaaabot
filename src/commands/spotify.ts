import { Message } from 'guilded.js';
import { spotifyApi, pendingAuth } from '../index.js';
import generateState from '../utils/generateOAuth.js';
import {formatCurrentlyPlaying, formatTopItems } from '../utils/spotify/formatData.js';
import { getCurrentlyPlaying, getTopArtists, getTopTracks } from '../utils/spotify/getUserData.js';
import { getValidAccessToken } from '../utils/spotify/manageAccessTokens.js';
import { SpotifyTokenService } from '../database/index.js';

const tokenService = new SpotifyTokenService();

// Spotify OAuth scopes needed
const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-top-read',
    'user-read-recently-played'
];

const spotify = async (message: Message, args: string[]) => {
    const userId = message.author!.id;
    const channelId = message.channelId;
    try {
        const accessToken = await getValidAccessToken(userId);
        switch (args[0]) {
            case 'connect':
            case 'login':
                // Generate OAuth URL
                const state = generateState();
                pendingAuth.set(state, { userId, channelId });
                
                const authUrl = spotifyApi.createAuthorizeURL(scopes, state);
                
                await message.reply(`🔗 **Connect your Spotify account:**\n${authUrl}\n\n*This link will expire in 10 minutes for security.*`);
                
                // Clean up pending auth after 10 minutes
                setTimeout(() => {
                    pendingAuth.delete(state);
                }, 10 * 60 * 1000);
                break;
                
            case 'now':
            case 'current':
            case 'playing':
                if (!accessToken) {
                    await message.reply("❌ You need to connect your Spotify account first! Use `!spotify connect`");
                    return;
                }
                
                const currentTrack = await getCurrentlyPlaying(accessToken);
                if (!currentTrack) {
                    await message.reply("❌ Failed to get currently playing track.");
                    return;
                }
                const currentMessage = formatCurrentlyPlaying(currentTrack);
                await message.reply(currentMessage);
                break;
                
            case 'top':
                if (!accessToken) {
                    await message.reply("❌ You need to connect your Spotify account first! Use `!spotify connect`");
                    return;
                }
                
                const subCommand = args[1]?.toLowerCase();
                const inputTimeRange = args[2] || 'medium_term'; // short_term, medium_term, long_term

                // validate time range
                const allowedRanges = ["short_term", "medium_term", "long_term"] as const;
                type TimeRange = typeof allowedRanges[number];
                const timeRange = allowedRanges.includes(inputTimeRange as TimeRange) ? (inputTimeRange as TimeRange) : undefined;

                if (subCommand === 'tracks') {
                    const topTracks = await getTopTracks(accessToken, timeRange);
                    if (!topTracks) {
                        await message.reply("❌ Failed to get top tracks.");
                        return;
                    }
                    const tracksMessage = formatTopItems(topTracks, 'tracks');
                    await message.reply(tracksMessage);
                } else if (subCommand === 'artists') {
                    const topArtists = await getTopArtists(accessToken, timeRange);
                    if (!topArtists) {
                        await message.reply("❌ Failed to get top artists.");
                        return;
                    }
                    const artistsMessage = formatTopItems(topArtists, 'artists');
                    await message.reply(artistsMessage);
                } else {
                    await message.reply("📊 **Usage:** `!spotify top [tracks/artists] [short_term/medium_term/long_term]`");
                }
                break;
                
            case 'disconnect':
                if (accessToken) {
                    await tokenService.deleteToken(userId);
                    await message.reply("✅ Your Spotify account has been disconnected.");
                } else {
                    await message.reply("❌ You don't have a connected Spotify account.");
                }
                break;
                
            case 'help':
            default:
                await message.reply(`🎵 **Spotify Bot Commands:**
\`!spotify connect\` - Connect your Spotify account
\`!spotify now\` - Show currently playing track
\`!spotify top tracks [time_range]\` - Show your top tracks
\`!spotify top artists [time_range]\` - Show your top artists
\`!spotify disconnect\` - Disconnect your Spotify account

**Time ranges:** short_term (4 weeks), medium_term (6 months), long_term (years)`);
                break;
        }
    } catch (error) {
        console.error('Error handling command:', error);
        await message.reply("❌ An error occurred while processing your request.");
    }
};

export default {
    name: 'spotify',
    aliases: ['s'],
    execute: spotify
};