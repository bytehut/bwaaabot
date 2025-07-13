import { getCollection } from './connection.js';
import type { SpotifyToken } from './connection.js';

const COLLECTION_NAME = 'spotify_tokens';

export class SpotifyTokenService {
  private get collection() {
    return getCollection<SpotifyToken>(COLLECTION_NAME);
  }

  async setToken(token: SpotifyToken): Promise<void> {
    try {
      await this.collection.replaceOne(
        { userId: token.userId },
        token,
        { upsert: true }
      );
    } catch (error) {
      console.error('Error storing Spotify token:', error);
      throw error;
    }
  }

  async getToken(userId: string): Promise<SpotifyToken | null> {
    try {
      return await this.collection.findOne({ userId });
    } catch (error) {
      console.error('Error retrieving Spotify token:', error);
      throw error;
    }
  }

  async deleteToken(userId: string): Promise<void> {
    try {
      await this.collection.deleteOne({ userId });
    } catch (error) {
      console.error('Error deleting Spotify token:', error);
      throw error;
    }
  }
}