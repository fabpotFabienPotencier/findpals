import { Controller, Get, Patch, Param, UseGuards, Request, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    async getNotifications(
        @Request() req,
        @Query('page') page?: string,
        @Query('limit') limit?: string
    ) {
        const userId = req.user.id;
        const pageNum = parseInt(page) || 1;
        const limitNum = parseInt(limit) || 20;
        return await this.notificationsService.getUserNotifications(userId, pageNum, limitNum);
    }

    @Get('unread-count')
    async getUnreadCount(@Request() req) {
        const count = await this.notificationsService.getUnreadCount(req.user.id);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Request() req, @Param('id') id: string) {
        return await this.notificationsService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    async markAllAsRead(@Request() req) {
        return await this.notificationsService.markAllAsRead(req.user.id);
    }
}
