import { ListenAlongSession } from '../../database/connection.js';

// Map serverId to list of roomIds (active sessions per server)
const serverToRooms: Map<string, string[]> = new Map();
// Map roomId to session (source of truth)
const roomIdToSession: Map<string, ListenAlongSession> = new Map();
// Map userId to roomId (enforce one session per user)
const userIdToRoomId: Map<string, string> = new Map();

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

export function getUserSessionRoomId(userId: string): string | undefined {
    return userIdToRoomId.get(userId);
}

export function endSession(roomId: string) {
    const session = roomIdToSession.get(roomId);
    if (!session) return;
    // Remove all currentListeners from userIdToRoomId
    for (const userId of session.currentListeners) {
        userIdToRoomId.delete(userId);
    }
    // Remove session from roomIdToSession
    roomIdToSession.delete(roomId);
    // Remove roomId from serverToRooms
    const roomIds = serverToRooms.get(session.serverId);
    if (roomIds) {
        serverToRooms.set(session.serverId, roomIds.filter((id: string) => id !== roomId));
        if (serverToRooms.get(session.serverId)!.length === 0) {
            serverToRooms.delete(session.serverId);
        }
    }
}

export function removeUserFromSession(userId: string) {
    const roomId = userIdToRoomId.get(userId);
    if (!roomId) return;
    const session = roomIdToSession.get(roomId);
    if (!session) return;
    session.currentListeners.delete(userId);
    userIdToRoomId.delete(userId);
    // If host leaves, end session
    if (session.host === userId) {
        endSession(roomId);
    }
}

export function joinSession(userId: string, roomId: string): boolean {
    // Remove user from any other session first
    removeUserFromSession(userId);
    const session = roomIdToSession.get(roomId);
    if (!session) return false;
    if (!session.currentListeners.has(userId)) {
        session.currentListeners.add(userId);
        session.listenersHistory.add(userId);
        userIdToRoomId.set(userId, roomId);
        return true;
    }
    return false;
}

export function getAllSessions(): ListenAlongSession[] {
    return Array.from(roomIdToSession.values());
} 