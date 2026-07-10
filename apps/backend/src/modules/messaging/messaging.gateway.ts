import {
    WebSocketGateway,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    WebSocketServer,
    OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessagingService } from './messaging.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
    cors: {
        origin: process.env.CORS_ORIGINS
            ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
            : ['http://localhost:3000'],
        credentials: true,
    },
    namespace: 'messaging',
})
export class MessagingGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly messagingService: MessagingService,
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
        } catch (e) {
            client.disconnect(true);
        }
    }

    @SubscribeMessage('sendMessage')
    async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() payload: any): Promise<void> {
        const senderId = client.data.userId;
        if (!senderId) return;

        const savedMessage = await this.messagingService.saveMessage(senderId, payload.chatId, payload.content);

        this.server.to(payload.chatId).emit('newMessage', {
            ...payload,
            senderId,
            id: savedMessage.id,
            createdAt: savedMessage.createdAt
        });
    }

    @SubscribeMessage('joinChat')
    handleJoinChat(@ConnectedSocket() client: Socket, @MessageBody() chatId: string): void {
        if (!client.data.userId) return;
        client.join(chatId);
    }

    @SubscribeMessage('getChatHistory')
    async handleGetChatHistory(@ConnectedSocket() client: Socket, @MessageBody() chatId: string): Promise<void> {
        if (!client.data.userId) return;
        const messages = await this.messagingService.getMessages(chatId);
        client.emit('chatHistory', { chatId, messages });
    }

    @SubscribeMessage('typing')
    handleTyping(@ConnectedSocket() client: Socket, @MessageBody() payload: { chatId: string, username: string }): void {
        if (!client.data.userId) return;
        const username = client.data.username || payload.username;
        client.to(payload.chatId).emit('userTyping', { chatId: payload.chatId, username });
    }
}
