import { Message } from 'guilded.js';
import { spotifyApi, pendingAuth } from '../index.js';
import generateState from '../utils/generateOAuth.js';
import {formatCurrentlyPlaying, formatTopItems } from '../utils/spotify/formatData.js';
import { getCurrentlyPlaying, getTopArtists, getTopTracks } from '../utils/spotify/getUserData.js';
import { getValidAccessToken } from '../utils/spotify/manageAccessTokens.js';
import { SpotifyTokenService } from '../database/index.js';
import { createSession, getSessionsByServer, getSessionByRoom, joinSession, removeUserFromSession, getUserSessionRoomId } from '../utils/spotify/listenAlongManager.js';
import { ListenAlongSession } from '../database/connection.js';
import { customAlphabet } from 'nanoid';
import { syncListenerToLeader } from '../utils/spotify/listenAlongSyncEngine.js';

const tokenService = new SpotifyTokenService();

// Spotify OAuth scopes needed
const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-top-read',
    'user-read-recently-played',
    'user-modify-playback-state'
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
                
            case 'listenalong': {
                const sub = args[1]?.toLowerCase();
                const serverId = message.serverId!;
                const nanoid = customAlphabet('1234567890abcdef', 8);
                switch (sub) {
                    case 'create': {
                        if (!accessToken) {
                            await message.reply("❌ You need to connect your Spotify account first! Use `!spotify connect`");
                            return;
                        }
                        // Generate unique roomId
                        const roomId = nanoid();
                        // Create new session
                        const session: ListenAlongSession = {
                            serverId,
                            roomId,
                            host: userId,
                            currentListeners: new Set([userId]),
                            listenersHistory: new Set([userId]),
                            trackHistory: [],
                            dateCreated: new Date(),
                            dateEnded: null
                        };
                        createSession(session);
                        await message.reply(`🎶 Listen Along session created! Room ID: \`\`\`${roomId}\`\`\`\n\n*This link will expire in 10 minutes for security.*`);
                        break;
                    }
                    case 'join': {
                        if (!accessToken) {
                            await message.reply("❌ You need to connect your Spotify account first! Use `!spotify connect`");
                            return;
                        }
                        const joinRoomId = args[2];
                        if (!joinRoomId) {
                            await message.reply('❌ Please specify a Room ID to join. Usage: `!spotify listenalong join [roomId]`');
                            break;
                        }
                        const session = getSessionByRoom(joinRoomId);
                        if (!session) {
                            await message.reply('❌ No active Listen Along session with that Room ID.');
                            break;
                        }
                        if (session.currentListeners.has(userId)) {
                            await message.reply('❌ You are already in this Listen Along session.');
                            break;
                        }
                        // Immediately sync playback to leader
                        const hostAccessToken = await getValidAccessToken(session.host);
                        if (hostAccessToken) {
                            const leaderPlayback = await getCurrentlyPlaying(hostAccessToken);
                            if (leaderPlayback) {
                                const result = await syncListenerToLeader(userId, leaderPlayback, true, true);
                                if (result === "NO_ACTIVE_DEVICE") {
                                    await message.reply(
                                        "❌ You must have an active Spotify device (e.g., open Spotify and start playing something on your phone or computer) before joining a Listen Along."
                                    );
                                    return;
                                }
                            }
                        }
                        joinSession(userId, joinRoomId);
                        await message.reply('🎶 You joined the Listen Along session!');
                        break;
                    }
                    case 'view': {
                        const sessions = getSessionsByServer(serverId);
                        if (sessions.length === 0) {
                            await message.reply('No active Listen Along sessions in this server.');
                        } else {
                            const list = sessions.map(s => `• Room ID: \`\`\`${s.roomId}\`\`\` Host: <@${s.host}>, Listeners: ${s.currentListeners.size}`).join('\n');
                            await message.reply(`🎶 **Active Listen Along sessions:**\n${list}`);
                        }
                        break;
                    }
                    case 'disconnect': {
                        // Remove user from their current session
                        const currentRoomId = getUserSessionRoomId(userId);
                        if (!currentRoomId) {
                            await message.reply('❌ You are not in any Listen Along session.');
                            break;
                        }
                        const session = getSessionByRoom(currentRoomId);
                        const wasHost = session && session.host === userId;
                        removeUserFromSession(userId);
                        if (wasHost) {
                            await message.reply('👋 You ended the Listen Along session as the host.');
                        } else {
                            await message.reply('👋 You left the Listen Along session.');
                        }
                        break;
                    }
                    default:
                        await message.reply(`🎵 **Listen Along Commands:**
\`!spotify listenalong create\` - Create a new Listen Along session
\`!spotify listenalong join [roomId]\` - Join a Listen Along session
\`!spotify listenalong view\` - View active Listen Along sessions
\`!spotify listenalong disconnect\` - Disconnect from the current Listen Along session
`);
                        break;
                }
                break;
            }
                
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

**Time ranges:** short_term (4 weeks), medium_term (6 months), long_term (years)

**Listen Along Commands:**
\`!spotify listenalong create\` - Create a new Listen Along session
\`!spotify listenalong join [roomId]\` - Join a Listen Along session
\`!spotify listenalong view\` - View active Listen Along sessions
\`!spotify listenalong disconnect\` - Disconnect from the current Listen Along session
`);
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