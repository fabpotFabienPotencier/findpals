import { Body, Controller, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { LiveRoomService } from './live-room.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { LiveAccessMode } from '../../entities/live-room.entity';

@Controller('live')
export class LiveStreamController {
    constructor(
        private readonly liveRoomService: LiveRoomService,
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

    @Post('rooms')
    async createRoom(@Req() req: Request, @Body() body: any) {
        const userId = this.extractUserId(req);

        const dto = {
            title: body.title as string,
            accessMode: body.accessMode as LiveAccessMode,
            price: body.price,
            isRecordingRequested: body.isRecordingRequested,
        };

        return this.liveRoomService.createRoom(userId, dto);
    }

    @Post('rooms/:id/tip')
    async tipRoom(@Req() req: Request, @Param('id') roomId: string, @Body() body: any) {
        const userId = this.extractUserId(req);
        const amount = Number(body.amount);
        return this.liveRoomService.tipAndGrantAccess(roomId, userId, amount);
    }

    @Post('rooms/:id/recording')
    async saveRecording(@Param('id') roomId: string, @Body() body: any) {
        return this.liveRoomService.saveRecording(roomId, body.recordingUrl);
    }
}


