import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { FeedService } from './feed.service';

@Controller('feed')
export class FeedController {
    constructor(private readonly feedService: FeedService) { }

    @Post('post')
    async createPost(@Body() body: any) {
        return this.feedService.createPost(body.authorId, body.content, body.type, body.mediaUrl);
    }

    @Get()
    async getFeed(@Query('page') page: string, @Query('limit') limit: string) {
        return this.feedService.getFeed(parseInt(page) || 1, parseInt(limit) || 10);
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
