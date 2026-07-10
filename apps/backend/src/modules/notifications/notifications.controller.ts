import { Controller, Get, Patch, Param, Req, Query, UnauthorizedException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('notifications')
export class NotificationsController {
    constructor(
        private readonly notificationsService: NotificationsService,
        private readonly jwtService: JwtService,
    ) {}

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

    @Get()
    async getNotifications(
        @Req() req: Request,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const userId = this.extractUserId(req);
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        return await this.notificationsService.getUserNotifications(userId, pageNum, limitNum);
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req: Request) {
        const userId = this.extractUserId(req);
        const count = await this.notificationsService.getUnreadCount(userId);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return await this.notificationsService.markAsRead(id, userId);
    }

    @Patch('read-all')
    async markAllAsRead(@Req() req: Request) {
        const userId = this.extractUserId(req);
        return await this.notificationsService.markAllAsRead(userId);
    }
}
