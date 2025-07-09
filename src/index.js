import * as dotenv from 'dotenv';
dotenv.config();

import { Client } from 'guilded.js';
import SpotifyWebApi from 'spotify-web-api-node';
import express from 'express';
import spotifyCallback from './routes/spotify-callback.js';

import { readdir } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


// Configuration
const config = {
    guildedToken: process.env.GUILDED_TOKEN,
    spotifyClientId: process.env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/spotify-callback',
    port: process.env.PORT || 3000,
    prefix: process.env.PREFIX
};

const commands = new Map();

// Initialize Guilded client
const client = new Client({
    token: config.guildedToken
});

// Initialize Spotify API
const spotifyApi = new SpotifyWebApi({
    clientId: config.spotifyClientId,
    clientSecret: config.spotifyClientSecret,
    redirectUri: config.redirectUri
});

// Initialize Express server for OAuth callback
const app = express();
app.use('/', spotifyCallback);
// app.use(express.json());

// Store user tokens (in production, use a proper database)
const userTokens = new Map();
const pendingAuth = new Map();


// Guilded bot event handlers
client.on('ready', () => {
    console.log(`Bot is ready! Logged in as ${client.user.name}`);
});

client.on('messageCreated', async (message) => {
    // Ignore bot messages
    if (message.createdByBotId) return;
    
    // Check if message starts with prefix
    if (!message.content.startsWith(config.prefix)) return;

    let [commandName, ...args] = message.content.slice(config.prefix.length).trim().split(/ +/);
    commandName = commandName.toLowerCase();

    const command = commands.get(commandName) ?? [...commands.values()].find((x) => x.aliases?.includes(commandName));
    if (!command) return;

    try {
        await command.execute(message, args);
    } catch (e) {
        void console.error(e);
        void client.messages.send(message.channelId, 'There was an error executing that command!');
    }
});

void (async () => {
    // read the commands dir and have the file extensions.
    const commandDir = await readdir(join(__dirname, "commands"), {
        withFileTypes: true,
    });

    // go through all the files/dirs scanned from the readdir, and make sure we only have js files
    for (const file of commandDir.filter((x) => x.name.endsWith('.js'))) {
        console.log(file.name);
        const command = await import(join(__dirname, "commands", file.name));
        commands.set(command.default.name, command.default);
    }

    client.login();
})();

// Start the web server
app.listen(config.port, () => {
    console.log(`OAuth server running on port ${config.port}`);
});

client.on('error', console.log);
client.on('exit', () => console.log('Disconnected!'));


export { spotifyApi, userTokens, pendingAuth };
