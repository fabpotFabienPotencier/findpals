import { Controller, Post, Get, Delete, Body, Query, Param, Req } from '@nestjs/common';
import { FeedService } from './feed.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('feed')
export class FeedController {
    constructor(
        private readonly feedService: FeedService,
        private readonly jwtService: JwtService,
    ) { }

    private extractUserId(req: Request): string {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);
        return payload.sub;
    }

    private tryExtractUserId(req: Request): string | undefined {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) return undefined;
            const [, token] = authHeader.split(' ');
            const payload: any = this.jwtService.decode(token);
            return payload?.sub || undefined;
        } catch {
            return undefined;
        }
    }

    @Post('post')
    async createPost(@Body() body: any) {
        return this.feedService.createPost(
            body.authorId, 
            body.content, 
            body.type, 
            body.mediaUrl,
            body.isLocked || false,
            Number(body.price) || 0
        );
    }

    @Delete('post/:id')
    async deletePost(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return this.feedService.deletePost(id, userId);
    }

    @Get()
    async getFeed(@Req() req: Request, @Query('page') page: string, @Query('limit') limit: string) {
        const userId = this.tryExtractUserId(req);
        return this.feedService.getFeed(userId, parseInt(page) || 1, parseInt(limit) || 10);
    }

    @Get('reels')
    async getReels(@Req() req: Request, @Query('page') page: string, @Query('limit') limit: string) {
        const userId = this.tryExtractUserId(req);
        return this.feedService.getReels(userId, parseInt(page) || 1, parseInt(limit) || 10);
    }

    @Get('stories')
    async getStories(@Req() req: Request) {
        const userId = this.tryExtractUserId(req);
        return this.feedService.getStories(userId);
    }

    @Get('user/:userId')
    async getUserPosts(@Req() req: Request, @Param('userId') userId: string, @Query('page') page: string, @Query('limit') limit: string) {
        const requestingUserId = this.tryExtractUserId(req);
        return this.feedService.getUserPosts(userId, requestingUserId, parseInt(page) || 1, parseInt(limit) || 10);
    }

    @Post('post/:id/like')
    async likePost(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return this.feedService.likePost(id, userId);
    }

    @Delete('post/:id/like')
    async unlikePost(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return this.feedService.unlikePost(id, userId);
    }

    @Get('post/:id/is-liked')
    async isLiked(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return { isLiked: await this.feedService.isLiked(id, userId) };
    }

    @Post('post/:id/unlock')
    async unlockPost(@Req() req: Request, @Param('id') id: string) {
        const userId = this.extractUserId(req);
        return this.feedService.unlockPost(id, userId);
    }

    @Post('comment')
    async addComment(@Body() body: any) {
        return this.feedService.addComment(body.postId, body.authorId, body.content);
    }

    @Get('post/:postId/comments')
    async getComments(@Param('postId') postId: string) {
        return this.feedService.getComments(postId);
    }
}
