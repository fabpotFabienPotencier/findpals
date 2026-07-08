import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { MessagingModule } from './modules/messaging/messaging.module';
import { FeedModule } from './modules/feed/feed.module';
import { CreatorModule } from './modules/creator/creator.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { LiveStreamModule } from './modules/live-stream/live-stream.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { CacheModule } from './modules/cache/cache.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { User } from './entities/user.entity';
import { Chat } from './entities/chat.entity';
import { Message } from './entities/message.entity';
import { Post } from './entities/feed.entity';
import { Comment } from './entities/comment.entity';
import { Transaction, Subscription } from './entities/economy.entity';
import { UserProgression, UserBadge, Badge } from './entities/gamification.entity';
import { Session } from './entities/session.entity';
import { LiveRoom, LiveAccess } from './entities/live-room.entity';
import { Payment } from './entities/payment.entity';
import { Follow } from './entities/follow.entity';
import { Notification } from './entities/notification.entity';
import { Like } from './entities/like.entity';

const isProduction = process.env.NODE_ENV === 'production';

@Module({
    imports: [
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [
                User, Chat, Message, Post, Comment,
                Transaction, Subscription,
                UserProgression, UserBadge, Badge,
                Session, LiveRoom, LiveAccess,
                Payment, Follow, Notification, Like,
            ],
            // CRITICAL: synchronize must be false in production to prevent data loss
            synchronize: !isProduction,
            // SSL required for Neon (managed Postgres) — disabled for local Docker
            ssl: process.env.DATABASE_URL?.includes('neon.tech')
                ? { rejectUnauthorized: false }
                : undefined,
            // Connection pooling settings for production
            ...(isProduction && {
                extra: {
                    max: 20,
                    idleTimeoutMillis: 30000,
                    connectionTimeoutMillis: 5000,
                },
            }),
        }),
        CacheModule,       // Global — Redis caching (available to all modules)
        AuthModule,
        UsersModule,       // User profiles, follow/unfollow
        MessagingModule,
        FeedModule,
        CreatorModule,
        GamificationModule,
        LiveStreamModule,
        PaymentsModule,
        StorageModule,     // Cloudflare R2 file uploads
        NotificationsModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule { }
