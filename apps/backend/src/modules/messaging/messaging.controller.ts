import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('messaging')
export class MessagingController {
    constructor(
        private readonly messagingService: MessagingService,
        private readonly jwtService: JwtService,
    ) { }

    private extractUserId(req: Request): string {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new UnauthorizedException('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        try {
            const payload: any = this.jwtService.verify(token);
            return payload.sub;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    @Post('message')
    async sendMessage(@Req() req: Request, @Body() body: any) {
        const senderId = this.extractUserId(req);
        return this.messagingService.saveMessage(
            senderId,
            body.chatId,
            body.content,
            body.type || 'text',
        );
    }
}
