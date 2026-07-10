import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { LiveRoomService } from './live-room.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LiveStreamService {
    // In-memory room storage for MVP. Use Redis in prod.
    public rooms: Record<string, string[]> = {};

    createRoom(roomId: string, hostId: string) {
        if (!this.rooms[roomId]) {
            this.rooms[roomId] = [hostId];
        }
    }

    joinRoom(roomId: string, userId: string) {
        if (this.rooms[roomId]) {
            this.rooms[roomId].push(userId);
        }
    }

    leaveRoom(roomId: string, userId: string) {
        if (this.rooms[roomId]) {
            this.rooms[roomId] = this.rooms[roomId].filter(id => id !== userId);
            if (this.rooms[roomId].length === 0) {
                delete this.rooms[roomId];
            }
        }
    }

    getRoomParticipants(roomId: string) {
        return this.rooms[roomId] || [];
    }
}

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:3000'],
        credentials: true,
    },
    namespace: 'live',
})
export class LiveStreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly liveStreamService: LiveStreamService,
        private readonly liveRoomService: LiveRoomService,
        private readonly jwtService: JwtService,
    ) { }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                client.disconnect(true);
                return;
            }
            const payload = await this.jwtService.verifyAsync(token);
            client.data.userId = payload.sub;
            client.data.username = payload.username;
        } catch {
            client.disconnect(true);
        }
    }

    handleDisconnect(@ConnectedSocket() client: Socket) {
        const userId = client.data.userId;
        if (!userId) return;

        // Clean up user from any live stream rooms they were participating in
        const roomIds = Object.keys(this.liveStreamService.rooms);
        for (const roomId of roomIds) {
            const participants = this.liveStreamService.getRoomParticipants(roomId);
            if (participants.includes(userId)) {
                this.liveStreamService.leaveRoom(roomId, userId);
                client.to(roomId).emit('userLeft', { userId });
            }
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string }) {
        const userId = client.data.userId;
        if (!userId) return;

        await this.liveRoomService.validateJoin(payload.roomId, userId);
        client.join(payload.roomId);
        this.liveStreamService.joinRoom(payload.roomId, userId);
        client.to(payload.roomId).emit('userJoined', { userId });
    }

    @SubscribeMessage('offer')
    handleOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, offer: any }) {
        if (!client.rooms.has(payload.roomId)) return; // Reject signaling if client hasn't joined the room
        client.to(payload.roomId).emit('offer', { offer: payload.offer, fromSocketId: client.id });
    }

    @SubscribeMessage('answer')
    handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, answer: any }) {
        if (!client.rooms.has(payload.roomId)) return; // Reject signaling if client hasn't joined the room
        client.to(payload.roomId).emit('answer', { answer: payload.answer, fromSocketId: client.id });
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, candidate: any }) {
        if (!client.rooms.has(payload.roomId)) return; // Reject signaling if client hasn't joined the room
        client.to(payload.roomId).emit('ice-candidate', { candidate: payload.candidate, fromSocketId: client.id });
    }
}
