import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';
import { Like } from '../../entities/like.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';
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
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async createPost(
        authorId: string, 
        content: string, 
        type: 'post' | 'reel' | 'story' = 'post', 
        mediaUrl?: string,
        isLocked: boolean = false,
        price: number = 0
    ) {
        const post = new Post();
        post.author = { id: authorId } as any;
        post.content = content;
        post.type = type;
        post.mediaUrl = mediaUrl;
        post.isLocked = isLocked;
        post.price = price;
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

    async isUnlocked(post: Post, userId?: string): Promise<boolean> {
        if (!post.isLocked || post.price <= 0) return true;
        if (!userId) return false;
        if (post.authorId === userId) return true;

        // Check if there is an unlock transaction reference
        const tx = await this.transactionRepository.findOne({
            where: {
                fromUser: { id: userId },
                reference: `post-unlock:${post.id}`,
            },
        });
        return !!tx;
    }

    async checkAndMaskPost(post: any, userId?: string): Promise<any> {
        const unlocked = await this.isUnlocked(post, userId);
        if (!unlocked) {
            return {
                ...post,
                mediaUrl: null, // Mask content
                lockedForUser: true,
            };
        }
        return {
            ...post,
            lockedForUser: false,
        };
    }

    async getFeed(requestingUserId?: string, page: number = 1, limit: number = 10) {
        const posts = await this.postRepository.find({
            where: { type: 'post' },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
        return Promise.all(posts.map(post => this.checkAndMaskPost(post, requestingUserId)));
    }

    async getReels(requestingUserId?: string, page: number = 1, limit: number = 10) {
        const reels = await this.postRepository.find({
            where: { type: 'reel' },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
        return Promise.all(reels.map(reel => this.checkAndMaskPost(reel, requestingUserId)));
    }

    async getStories(requestingUserId?: string) {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const stories = await this.postRepository.find({
            where: {
                type: 'story',
                createdAt: MoreThan(twentyFourHoursAgo),
            },
            order: { createdAt: 'DESC' },
            relations: ['author'],
        });
        return Promise.all(stories.map(story => this.checkAndMaskPost(story, requestingUserId)));
    }

    async getUserPosts(userId: string, requestingUserId?: string, page: number = 1, limit: number = 10) {
        const posts = await this.postRepository.find({
            where: { authorId: userId },
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
        return Promise.all(posts.map(post => this.checkAndMaskPost(post, requestingUserId)));
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

    async unlockPost(postId: string, userId: string) {
        const post = await this.postRepository.findOne({ where: { id: postId }, relations: ['author'] });
        if (!post) throw new NotFoundException('Post not found');

        const alreadyUnlocked = await this.isUnlocked(post, userId);
        if (alreadyUnlocked) return { success: true, message: 'Already unlocked' };

        const buyer = await this.userRepository.findOne({ where: { id: userId } });
        if (!buyer) throw new NotFoundException('User not found');

        if (Number(buyer.walletBalance) < Number(post.price)) {
            throw new ConflictException('Insufficient wallet balance');
        }

        const creator = await this.userRepository.findOne({ where: { id: post.authorId } });
        if (!creator) throw new NotFoundException('Creator not found');

        // Execute transactionally with pessimistic locking
        await this.postRepository.manager.transaction(async (manager) => {
            const txBuyer = await manager.findOne(User, {
                where: { id: userId },
                lock: { mode: 'pessimistic_write' },
            });
            const txCreator = await manager.findOne(User, {
                where: { id: post.authorId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!txBuyer || !txCreator) {
                throw new NotFoundException('Buyer or creator not found');
            }

            if (Number(txBuyer.walletBalance) < Number(post.price)) {
                throw new ConflictException('Insufficient wallet balance');
            }

            txBuyer.walletBalance = Number(txBuyer.walletBalance) - Number(post.price);
            txCreator.walletBalance = Number(txCreator.walletBalance) + Number(post.price);

            await manager.save(txBuyer);
            await manager.save(txCreator);

            const tx = new Transaction();
            tx.amount = post.price;
            tx.type = 'tip';
            tx.reference = `post-unlock:${post.id}`;
            tx.fromUser = txBuyer;
            tx.toUser = txCreator;
            await manager.save(tx);
        });

        // Notify Creator
        const buyerName = buyer.displayName || buyer.username || 'Someone';
        await this.notificationsService.createNotification(
            post.authorId,
            'like',
            `${buyerName} unlocked your premium post for $${post.price}`,
            postId,
        );

        return { success: true };
    }
}
