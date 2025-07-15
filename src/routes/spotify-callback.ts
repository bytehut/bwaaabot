import { client, spotifyApi, pendingAuth } from '../index.js';
import { setToken } from '../utils/spotify/manageAccessTokens.js';
import express from 'express';
const router = express.Router();


// OAuth callback route
router.get('/spotify-callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
        return res.status(400).send('Authorization code missing');
    }
    
    const pendingData = pendingAuth.get(state);
    if (!pendingData) {
        return res.status(400).send('Invalid state parameter');
    }
    
    try {
        // Exchange code for access token
        const data = await spotifyApi.authorizationCodeGrant(code as string);
        const { access_token, refresh_token, expires_in } = data.body;
        
        // store token
        await setToken(pendingData.userId, access_token, refresh_token, expires_in);
        
        // Clean up pending auth
        pendingAuth.delete(state);
        
        res.send(`
            <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h2>✅ Successfully connected to Spotify!</h2>
                    <p>You can now close this window and use the !spotify command in Guilded.</p>
                </body>
            </html>
        `);
        
        // Notify user in Guilded
        const channel = client.channels.cache.get(pendingData.channelId);
        if (channel) {
            channel.send(`<@${pendingData.userId}> Your Spotify account has been successfully connected! 🎵`);
        }
        
    } catch (error) {
        console.error('Error exchanging code for token:', error);
        res.status(500).send('Error connecting to Spotify');
    }
});

export default router;