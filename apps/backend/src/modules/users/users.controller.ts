import { Controller, Get, Patch, Post, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('users')
export class UsersController {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    private extractUserId(req: Request): string {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);
        return payload.sub;
    }

    @Get('me')
    async getMyProfile(@Req() req: Request) {
        const userId = this.extractUserId(req);
        return this.usersService.getProfile(userId);
    }

    @Patch('me')
    async updateMyProfile(@Req() req: Request, @Body() body: any) {
        const userId = this.extractUserId(req);
        return this.usersService.updateProfile(userId, {
            displayName: body.displayName,
            bio: body.bio,
            avatarUrl: body.avatarUrl,
        });
    }

    @Get('search')
    async searchUsers(@Query('q') query: string, @Query('limit') limit: string) {
        return this.usersService.searchUsers(query, parseInt(limit) || 20);
    }

    @Get(':id')
    async getUserProfile(@Param('id') userId: string) {
        return this.usersService.getProfile(userId);
    }

    @Post(':id/follow')
    async followUser(@Req() req: Request, @Param('id') targetId: string) {
        const userId = this.extractUserId(req);
        return this.usersService.followUser(userId, targetId);
    }

    @Delete(':id/follow')
    async unfollowUser(@Req() req: Request, @Param('id') targetId: string) {
        const userId = this.extractUserId(req);
        return this.usersService.unfollowUser(userId, targetId);
    }

    @Get(':id/followers')
    async getFollowers(@Param('id') userId: string, @Query('page') page: string, @Query('limit') limit: string) {
        return this.usersService.getFollowers(userId, parseInt(page) || 1, parseInt(limit) || 20);
    }

    @Get(':id/following')
    async getFollowing(@Param('id') userId: string, @Query('page') page: string, @Query('limit') limit: string) {
        return this.usersService.getFollowing(userId, parseInt(page) || 1, parseInt(limit) || 20);
    }

    @Get(':id/is-following')
    async isFollowing(@Req() req: Request, @Param('id') targetId: string) {
        const userId = this.extractUserId(req);
        return { isFollowing: await this.usersService.isFollowing(userId, targetId) };
    }
}
