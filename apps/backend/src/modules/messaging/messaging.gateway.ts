import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { MessagingService } from './messaging.service';
// In a real app, we'd have a WsAuthGuard here

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:3000'],
        credentials: true,
    },
    namespace: 'messaging',
})
export class MessagingGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly messagingService: MessagingService) { }

    @SubscribeMessage('sendMessage')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): Promise<void> {
        // payload: { chatId, content, senderId }
        // Verify sender from token (simplified here, assumes guard does check)
        const savedMessage = await this.messagingService.saveMessage(payload.senderId, payload.chatId, payload.content);

        this.server.to(payload.chatId).emit('newMessage', {
            ...payload,
            id: savedMessage.id,
            createdAt: savedMessage.createdAt
        });
    }

    @SubscribeMessage('joinChat')
    handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string): void {
        client.join(chatId);
    }

    @SubscribeMessage('getChatHistory')
    async handleGetChatHistory(@ConnectedSocket() client: Socket, @MessageBody() chatId: string): Promise<void> {
        const messages = await this.messagingService.getMessages(chatId);
        client.emit('chatHistory', { chatId, messages });
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string, username: string }): void {
        client.to(payload.chatId).emit('userTyping', payload);
    }
}
