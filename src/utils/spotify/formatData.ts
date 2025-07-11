

// Function to format currently playing track message
function formatCurrentlyPlaying(track: SpotifyApi.CurrentlyPlayingObject) {
    if (!track || !track.item) {
        return "🎵 No track currently playing";
    }
    
    const item = track.item;
    if (!('artists' in item)) {  // TODO: Replace with a type guard
        return "Episodes not currently supported";
    }
    const song: SpotifyApi.TrackObjectFull = item as unknown as SpotifyApi.TrackObjectFull;
    const artists = song.artists!.map(artist => artist.name).join(', ');
    const album = song.album.name;
    const progress = track.progress_ms ?? 0;
    const duration = song.duration_ms;
    
    const progressMin = Math.floor(progress / 60000);
    const progressSec = Math.floor((progress % 60000) / 1000);
    const durationMin = Math.floor(duration / 60000);
    const durationSec = Math.floor((duration % 60000) / 1000);
    
    const progressBar = createProgressBar(progress, duration);
    
    return `🎵 **Currently Playing:**
**${song.name}** by ${artists}
📀 Album: ${album}
⏱️ ${progressMin}:${progressSec.toString().padStart(2, '0')} ${progressBar} ${durationMin}:${durationSec.toString().padStart(2, '0')}
🔗 [Open in Spotify](${song.external_urls.spotify})`;
}

// Function to create a simple progress bar
function createProgressBar(current: number, total: number, length = 20) {
    const percentage = current / total;
    const filled = Math.round(percentage * length);
    const empty = length - filled;
    return '▓'.repeat(filled) + '░'.repeat(empty);
}

// Function to format top tracks/artists
function formatTopItems(items: SpotifyApi.UsersTopArtistsResponse | SpotifyApi.UsersTopTracksResponse, type = 'tracks') {
    if (!items || !items.items || items.items.length === 0) {
        return `No top ${type} found`;
    }
    
    const formatted = items.items.slice(0, 5).map((item, index) => {
        if ('artists' in item) {  // TODO: Maybe more type guarding
            const artists = item.artists.map(artist => artist.name).join(', ');
            return `${index + 1}. **${item.name}** by ${artists}`;
        } else {
            return `${index + 1}. **${item.name}**`;
        }
    }).join('\n');
    
    return `🎵 **Your Top ${type === 'tracks' ? 'Tracks' : 'Artists'}:**\n${formatted}`;
}

export { formatCurrentlyPlaying, formatTopItems };