import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Follow } from '../../entities/follow.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Follow)
        private readonly followRepository: Repository<Follow>,
    ) { }

    async getProfile(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        return {
            id: user.id,
            username: user.username,
            displayName: user.displayName,
            bio: user.bio,
            avatarUrl: user.avatarUrl,
            isCreator: user.isCreator,
            xp: user.xp,
            level: user.level,
            followersCount: user.followersCount,
            followingCount: user.followingCount,
            postsCount: user.postsCount,
            createdAt: user.createdAt,
        };
    }

    async updateProfile(userId: string, updates: { displayName?: string; bio?: string; avatarUrl?: string }) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new NotFoundException('User not found');

        if (updates.displayName !== undefined) user.displayName = updates.displayName;
        if (updates.bio !== undefined) user.bio = updates.bio;
        if (updates.avatarUrl !== undefined) user.avatarUrl = updates.avatarUrl;

        const saved = await this.userRepository.save(user);
        return {
            id: saved.id,
            username: saved.username,
            displayName: saved.displayName,
            bio: saved.bio,
            avatarUrl: saved.avatarUrl,
        };
    }

    async searchUsers(query: string, limit: number = 20) {
        if (!query || query.length < 2) return [];

        const users = await this.userRepository.find({
            where: [
                { username: Like(`%${query}%`) },
                { displayName: Like(`%${query}%`) },
            ],
            select: ['id', 'username', 'displayName', 'avatarUrl', 'isCreator', 'level'],
            take: limit,
        });

        return users;
    }

    async followUser(followerId: string, followingId: string) {
        if (followerId === followingId) {
            throw new ConflictException('Cannot follow yourself');
        }

        const existing = await this.followRepository.findOne({
            where: { followerId, followingId },
        });
        if (existing) {
            throw new ConflictException('Already following this user');
        }

        const targetUser = await this.userRepository.findOne({ where: { id: followingId } });
        if (!targetUser) throw new NotFoundException('User not found');

        const follow = new Follow();
        follow.followerId = followerId;
        follow.followingId = followingId;
        await this.followRepository.save(follow);

        // Update denormalized counts
        await this.userRepository.increment({ id: followingId }, 'followersCount', 1);
        await this.userRepository.increment({ id: followerId }, 'followingCount', 1);

        return { success: true };
    }

    async unfollowUser(followerId: string, followingId: string) {
        const follow = await this.followRepository.findOne({
            where: { followerId, followingId },
        });
        if (!follow) {
            throw new NotFoundException('Not following this user');
        }

        await this.followRepository.remove(follow);

        // Update denormalized counts
        await this.userRepository.decrement({ id: followingId }, 'followersCount', 1);
        await this.userRepository.decrement({ id: followerId }, 'followingCount', 1);

        return { success: true };
    }

    async getFollowers(userId: string, page: number = 1, limit: number = 20) {
        const follows = await this.followRepository.find({
            where: { followingId: userId },
            relations: ['follower'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return follows.map(f => ({
            id: f.follower.id,
            username: f.follower.username,
            displayName: f.follower.displayName,
            avatarUrl: f.follower.avatarUrl,
            followedAt: f.createdAt,
        }));
    }

    async getFollowing(userId: string, page: number = 1, limit: number = 20) {
        const follows = await this.followRepository.find({
            where: { followerId: userId },
            relations: ['following'],
            skip: (page - 1) * limit,
            take: limit,
            order: { createdAt: 'DESC' },
        });

        return follows.map(f => ({
            id: f.following.id,
            username: f.following.username,
            displayName: f.following.displayName,
            avatarUrl: f.following.avatarUrl,
            followedAt: f.createdAt,
        }));
    }

    async isFollowing(followerId: string, followingId: string): Promise<boolean> {
        const follow = await this.followRepository.findOne({
            where: { followerId, followingId },
        });
        return !!follow;
    }
}
