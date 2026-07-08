import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';
import { Like } from '../../entities/like.entity';
import { User } from '../../entities/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
        @InjectRepository(Like)
        private readonly likeRepository: Repository<Like>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async createPost(authorId: string, content: string, type: 'post' | 'reel' | 'story' = 'post', mediaUrl?: string) {
        const post = new Post();
        post.author = { id: authorId } as any;
        post.content = content;
        post.type = type;
        post.mediaUrl = mediaUrl;
        const saved = await this.postRepository.save(post);

        // Increment the user's denormalized postsCount
        await this.userRepository.increment({ id: authorId }, 'postsCount', 1);

        return saved;
    }

    async deletePost(postId: string, userId: string) {
        const post = await this.postRepository.findOne({ where: { id: postId, authorId: userId } });
        if (!post) throw new NotFoundException('Post not found or not yours');
        await this.postRepository.remove(post);
        await this.userRepository.decrement({ id: userId }, 'postsCount', 1);
        return { success: true };
    }

    async getFeed(page: number = 1, limit: number = 10) {
        return this.postRepository.find({
            where: { type: 'post' },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
    }

    async getReels(page: number = 1, limit: number = 10) {
        return this.postRepository.find({
            where: { type: 'reel' },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
    }

    async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
        return this.postRepository.find({
            where: { authorId: userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
    }

    async likePost(postId: string, userId: string) {
        const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['author'] });
        if (!post) throw new NotFoundException('Post not found');

        const existing = await this.likeRepository.findOne({ where: { userId, postId } });
        if (existing) throw new ConflictException('Already liked');

        const like = new Like();
        like.userId = userId;
        like.postId = postId;
        await this.likeRepository.save(like);

        // Increment the post's denormalized likesCount
        await this.postRepository.increment({ id: postId }, 'likesCount', 1);

        // Generate notification for the post author (don't notify yourself)
        if (post.authorId !== userId) {
            const liker = await this.userRepository.findOne({ where: { id: userId } });
            const likerName = liker?.displayName || liker?.username || 'Someone';
            await this.notificationsService.createNotification(
                post.authorId,
                'like',
                `${likerName} liked your post`,
                postId,
            );
        }

        return { success: true, likesCount: post.likesCount + 1 };
    }

    async unlikePost(postId: string, userId: string) {
        const like = await this.likeRepository.findOne({ where: { userId, postId } });
        if (!like) throw new NotFoundException('Not liked');
        await this.likeRepository.remove(like);
        await this.postRepository.decrement({ id: postId }, 'likesCount', 1);
        return { success: true };
    }

    async isLiked(postId: string, userId: string): Promise<boolean> {
        const like = await this.likeRepository.findOne({ where: { userId, postId } });
        return !!like;
    }

    async addComment(postId: string, authorId: string, content: string) {
        const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['author'] });
        if (!post) throw new NotFoundException('Post not found');

        const comment = new Comment();
        comment.post = { id: postId } as Post;
        comment.author = { id: authorId } as any;
        comment.content = content;
        const saved = await this.commentRepository.save(comment);

        // Generate notification for the post author (don't notify yourself)
        if (post.authorId !== authorId) {
            const commenter = await this.userRepository.findOne({ where: { id: authorId } });
            const commenterName = commenter?.displayName || commenter?.username || 'Someone';
            await this.notificationsService.createNotification(
                post.authorId,
                'comment',
                `${commenterName} commented on your post`,
                postId,
            );
        }

        return saved;
    }

    async getComments(postId: string) {
        return this.commentRepository.find({
            where: { postId },
            relations: ['author'],
            order: { createdAt: 'ASC' }
        });
    }
}
