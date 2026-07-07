import { Body, Controller, Param, Post, Req } from '@nestjs/common';
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

    @Post('rooms')
    async createRoom(@Req() req: Request, @Body() body: any) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);

        const dto = {
            title: body.title as string,
            accessMode: body.accessMode as LiveAccessMode,
            price: body.price,
            isRecordingRequested: body.isRecordingRequested,
        };

        return this.liveRoomService.createRoom(payload.sub, dto);
    }

    @Post('rooms/:id/tip')
    async tipRoom(@Req() req: Request, @Param('id') roomId: string, @Body() body: any) {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);

        const amount = Number(body.amount);
        return this.liveRoomService.tipAndGrantAccess(roomId, payload.sub, amount);
    }

    @Post('rooms/:id/recording')
    async saveRecording(@Param('id') roomId: string, @Body() body: any) {
        return this.liveRoomService.saveRecording(roomId, body.recordingUrl);
    }
}


