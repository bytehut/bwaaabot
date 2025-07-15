import { ListenAlongSession } from '../../database/connection.js';

// Map serverId to list of roomIds (active sessions per server)
const serverToRooms: Map<string, string[]> = new Map();
// Map roomId to session (source of truth)
const roomIdToSession: Map<string, ListenAlongSession> = new Map();

export function createSession(session: ListenAlongSession) {
    roomIdToSession.set(session.roomId, session);
    if (!serverToRooms.has(session.serverId)) {
        serverToRooms.set(session.serverId, []);
    }
    serverToRooms.get(session.serverId)!.push(session.roomId);
}

export function getSessionsByServer(serverId: string): ListenAlongSession[] {
    const roomIds = serverToRooms.get(serverId) || [];
    return roomIds.map(roomId => roomIdToSession.get(roomId)).filter(Boolean) as ListenAlongSession[];
}

export function getSessionByRoom(roomId: string): ListenAlongSession | undefined {
    return roomIdToSession.get(roomId);
}

export function getAllSessions(): ListenAlongSession[] {
    return Array.from(roomIdToSession.values());
}

export function joinSession(roomId: string, userId: string): boolean {
    const session = roomIdToSession.get(roomId);
    if (!session) return false;
    if (!session.currentListeners.includes(userId)) {
        session.currentListeners.push(userId);
        session.listenersHistory.add(userId);
        return true;
    }
    return false;
}

export function disconnectSession(roomId: string, userId: string): boolean {
    const session = roomIdToSession.get(roomId);
    if (!session) return false;
    // Remove from listeners
    session.listeners = session.currentListeners.filter((id: string) => id !== userId);
    // If host leaves or no listeners left, end session
    if (session.host === userId || session.currentListeners.length === 0) {
        // Remove from roomIdToSession
        roomIdToSession.delete(roomId);
        // Remove roomId from serverToRooms
        const roomIds = serverToRooms.get(session.serverId);
        if (roomIds) {
            serverToRooms.set(session.serverId, roomIds.filter((id: string) => id !== roomId));
            if (serverToRooms.get(session.serverId)!.length === 0) {
                serverToRooms.delete(session.serverId);
            }
        }
        return true;
    }
    return false;
} 