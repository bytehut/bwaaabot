import { getAllSessions } from './listenAlongManager.js';
import { getCurrentlyPlaying } from './getUserData.js';
import { getValidAccessToken } from './manageAccessTokens.js';
import { spotifyApi } from '../../index.js';
import { ListenAlongSession } from '../../database/connection.js';

// Extend ListenAlongSession in-memory with lastLeaderPlayback
interface InMemorySession extends ListenAlongSession {
  lastLeaderPlayback?: SpotifyApi.CurrentlyPlayingResponse;
}

// Poll interval in ms
const POLL_INTERVAL = 3000;

export function startListenAlongSyncEngine() {
  setInterval(async () => {
    const allSessions: InMemorySession[] = [];
    for (const session of getAllSessions()) {
      allSessions.push(session as InMemorySession);
    }
    
    for (const session of allSessions) {
      try {
        // Get host's access token
        const hostAccessToken = await getValidAccessToken(session.host);
        if (!hostAccessToken) continue;
        // Get leader's playback
        const leaderPlayback = await getCurrentlyPlaying(hostAccessToken);
        if (!leaderPlayback || !leaderPlayback.is_playing || !leaderPlayback.item) continue;
        // Compare with last known state
        const last = session.lastLeaderPlayback;
        const trackChanged = !last || last.item?.id !== leaderPlayback.item.id;
        const seekChanged = !last || Math.abs((leaderPlayback.progress_ms ?? 0) - (last.progress_ms ?? 0)) > 3000;
        if (trackChanged || seekChanged) {
          // Update all listeners
          for (const listenerId of session.currentListeners) {
            if (listenerId === session.host) continue;
            const listenerToken = await getValidAccessToken(listenerId);
            if (!listenerToken) continue;
            try {
              spotifyApi.setAccessToken(listenerToken);
              // If track changed, start playing the new track at the correct position
              if (trackChanged) {
                await spotifyApi.play({
                  uris: [leaderPlayback.item.uri],
                  position_ms: leaderPlayback.progress_ms ?? 0
                });
              } else if (seekChanged) {
                // If only seek changed, seek to the correct position
                await spotifyApi.seek(leaderPlayback.progress_ms ?? 0);
              }
            } catch (err) {
              // Handle playback sync error for this listener
              // (e.g., log, optionally remove from session)
              console.error(`Failed to sync listener ${listenerId}:`, err);
            }
          }
          // Update last known state
          session.lastLeaderPlayback = leaderPlayback;
        }
      } catch (err) {
        // Handle error for this session
        console.error(`Error in sync engine for session ${session.roomId}:`, err);
      }
    }
  }, POLL_INTERVAL);
} 