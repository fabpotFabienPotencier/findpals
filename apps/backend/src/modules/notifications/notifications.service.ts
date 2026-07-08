import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../entities/notification.entity';

@Injectable()
export class NotificationsService {
    constructor(
        @InjectRepository(Notification)
        private readonly notificationRepository: Repository<Notification>,
    ) {}

    async createNotification(
        userId: string, 
        type: 'like' | 'comment' | 'follow' | 'system', 
        content: string, 
        relatedEntityId?: string
    ) {
        const notification = this.notificationRepository.create({
            userId,
            type,
            content,
            relatedEntityId
        });
        return await this.notificationRepository.save(notification);
    }

    async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
        return await this.notificationRepository.find({
            where: { userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit
        });
    }

    async getUnreadCount(userId: string) {
        return await this.notificationRepository.count({
            where: { userId, isRead: false }
        });
    }

    async markAsRead(notificationId: string, userId: string) {
        const notification = await this.notificationRepository.findOne({
            where: { id: notificationId, userId }
        });
        
        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        notification.isRead = true;
        return await this.notificationRepository.save(notification);
    }

    async markAllAsRead(userId: string) {
        await this.notificationRepository.update(
            { userId, isRead: false },
            { isRead: true }
        );
        return { success: true };
    }
}
