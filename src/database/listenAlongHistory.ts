import { getCollection } from './connection.js';
import type { ListenAlongHistory, ListenAlongSession } from './connection.js';

const COLLECTION_NAME = 'listen_along_history';

export class ListenAlongHistoryService {
  private get collection() {
    return getCollection<ListenAlongHistory>(COLLECTION_NAME);
  }

//   async addSession(serverId: string, session: ListenAlongSession): Promise<void> {
//     try {
//       await this.collection.updateOne(
//         { serverId },
//         { 
//           $push: { sessions: session },
//           $setOnInsert: { serverId }
//         },
//         { upsert: true }
//       );
//     } catch (error) {
//       console.error('Error adding listen along session:', error);
//       throw error;
//     }
//   }

//   async getHistory(serverId: string): Promise<ListenAlongHistory | null> {
//     try {
//       return await this.collection.findOne({ serverId });
//     } catch (error) {
//       console.error('Error retrieving listen along history:', error);
//       throw error;
//     }
//   }

//   async getRecentSessions(serverId: string, limit: number = 10): Promise<ListenAlongSession[]> {
//     try {
//       const history = await this.collection.findOne(
//         { serverId },
//         { 
//           projection: { 
//             sessions: { $slice: -limit } 
//           } 
//         }
//       );
      
//       return history?.sessions || [];
//     } catch (error) {
//       console.error('Error retrieving recent sessions:', error);
//       throw error;
//     }
//   }

//   async updateSession(serverId: string, sessionIndex: number, updates: Partial<ListenAlongSession>): Promise<void> {
//     try {
//       const updateFields: any = {};
      
//       if (updates.host) updateFields[`sessions.${sessionIndex}.host`] = updates.host;
//       if (updates.listeners) updateFields[`sessions.${sessionIndex}.listeners`] = updates.listeners;
//       if (updates.songs) updateFields[`sessions.${sessionIndex}.songs`] = updates.songs;
//       if (updates.date) updateFields[`sessions.${sessionIndex}.date`] = updates.date;

//       await this.collection.updateOne(
//         { serverId },
//         { $set: updateFields }
//       );
//     } catch (error) {
//       console.error('Error updating session:', error);
//       throw error;
//     }
//   }

//   async addSongToSession(serverId: string, sessionIndex: number, trackId: string): Promise<void> {
//     try {
//       await this.collection.updateOne(
//         { serverId },
//         { $push: { [`sessions.${sessionIndex}.songs`]: trackId } }
//       );
//     } catch (error) {
//       console.error('Error adding song to session:', error);
//       throw error;
//     }
//   }

//   async addListenerToSession(serverId: string, sessionIndex: number, userId: string): Promise<void> {
//     try {
//       await this.collection.updateOne(
//         { serverId },
//         { $addToSet: { [`sessions.${sessionIndex}.listeners`]: userId } }
//       );
//     } catch (error) {
//       console.error('Error adding listener to session:', error);
//       throw error;
//     }
//   }

//   async removeListenerFromSession(serverId: string, sessionIndex: number, userId: string): Promise<void> {
//     try {
//       await this.collection.updateOne(
//         { serverId },
//         { $pull: { [`sessions.${sessionIndex}.listeners`]: userId } }
//       );
//     } catch (error) {
//       console.error('Error removing listener from session:', error);
//       throw error;
//     }
//   }

//   async deleteServerHistory(serverId: string): Promise<void> {
//     try {
//       await this.collection.deleteOne({ serverId });
//     } catch (error) {
//       console.error('Error deleting server history:', error);
//       throw error;
//     }
//   }
}