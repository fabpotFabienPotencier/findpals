import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';
import { Like } from '../../entities/like.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Post, Comment, Like, User, Transaction]),
        JwtModule.register({ secret: process.env.JWT_SECRET || 'fallback-secret' }),
        NotificationsModule,
    ],
    providers: [FeedService],
    controllers: [FeedController],
    exports: [FeedService],
})
export class FeedModule { }
