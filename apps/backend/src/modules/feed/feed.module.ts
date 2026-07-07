import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedService } from './feed.service';
import { FeedController } from './feed.controller';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Post, Comment])],
    providers: [FeedService],
    controllers: [FeedController],
    exports: [FeedService],
})
export class FeedModule { }
