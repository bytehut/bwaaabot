import { client, spotifyApi, userTokens, pendingAuth } from '../index.js';
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
        const data = await spotifyApi.authorizationCodeGrant(code);
        const { access_token, refresh_token, expires_in } = data.body;
        
        // Store user tokens
        userTokens.set(pendingData.userId, {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: Date.now() + (expires_in * 1000)
        });
        
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