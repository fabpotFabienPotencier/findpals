import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../../entities/post.entity';
import { Comment } from '../../entities/comment.entity';

@Injectable()
export class FeedService {
    constructor(
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        @InjectRepository(Comment)
        private readonly commentRepository: Repository<Comment>,
    ) { }

    async createPost(authorId: string, content: string, type: 'post' | 'reel' | 'story' = 'post', mediaUrl?: string) {
        const post = new Post();
        post.author = { id: authorId } as any;
        post.content = content;
        post.type = type;
        post.mediaUrl = mediaUrl;
        return this.postRepository.save(post);
    }

    async getFeed(page: number = 1, limit: number = 10) {
        return this.postRepository.find({
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
            relations: ['author'],
        });
    }

    async addComment(postId: string, authorId: string, content: string) {
        const comment = new Comment();
        comment.post = { id: postId } as Post;
        comment.author = { id: authorId } as any;
        comment.content = content;
        return this.commentRepository.save(comment);
    }

    async getComments(postId: string) {
        return this.commentRepository.find({
            where: { postId },
            relations: ['author'],
            order: { createdAt: 'ASC' }
        });
    }
}
