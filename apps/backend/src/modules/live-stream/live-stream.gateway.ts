import { WebSocketGateway, SubscribeMessage, MessageBody, ConnectedSocket, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { LiveRoomService } from './live-room.service';

@Injectable()
export class LiveStreamService {
    // In-memory room storage for MVP. Use Redis in prod.
    private rooms: Record<string, string[]> = {};

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
export class LiveStreamGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly liveStreamService: LiveStreamService,
        private readonly liveRoomService: LiveRoomService,
    ) { }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, userId: string }) {
        await this.liveRoomService.validateJoin(payload.roomId, payload.userId);
        client.join(payload.roomId);
        this.liveStreamService.joinRoom(payload.roomId, payload.userId);
        client.to(payload.roomId).emit('userJoined', { userId: payload.userId });
    }

    @SubscribeMessage('offer')
    handleOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, offer: any }) {
        // Broadcast offer to all other peers in the room
        client.to(payload.roomId).emit('offer', { offer: payload.offer, fromSocketId: client.id });
    }

    @SubscribeMessage('answer')
    handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, answer: any }) {
        client.to(payload.roomId).emit('answer', { answer: payload.answer, fromSocketId: client.id });
    }

    @SubscribeMessage('ice-candidate')
    handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() payload: { roomId: string, candidate: any }) {
        client.to(payload.roomId).emit('ice-candidate', { candidate: payload.candidate, fromSocketId: client.id });
    }
}
