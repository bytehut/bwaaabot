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

export async function syncListenerToLeader(
    listenerId: string,
    leaderPlayback: SpotifyApi.CurrentlyPlayingResponse,
    trackChanged: boolean,
    seekChanged: boolean
) {
    try {
        if (!leaderPlayback || !leaderPlayback.is_playing || !leaderPlayback.item) return;
        const userAccessToken = await getValidAccessToken(listenerId);
        if (!userAccessToken) return;
        spotifyApi.setAccessToken(userAccessToken);
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
        console.error(`Failed to sync listener ${listenerId} to leader:`, err);
        throw err;
    }
}

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
        // Drift detection: only sync if leader's position is outside [last + poll_interval - 3, last + poll_interval + 3]
        let seekChanged = false;
        if (last && last.progress_ms !== undefined && leaderPlayback.progress_ms !== undefined) {
          const lastProgress = last.progress_ms ?? 0;
          const leaderProgress = leaderPlayback.progress_ms ?? 0;
          const expected = lastProgress + POLL_INTERVAL;
          const lower = expected - 3000;
          const upper = expected + 3000;
          seekChanged = leaderProgress < lower || leaderProgress > upper;
        } else {
          seekChanged = true;
        }
        const trackChanged = !last || last.item?.id !== leaderPlayback.item.id;
        if (trackChanged || seekChanged) {
          // Update all listeners
          for (const listenerId of session.currentListeners) {
            if (listenerId === session.host) continue;
            await syncListenerToLeader(listenerId, leaderPlayback, trackChanged, seekChanged);
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