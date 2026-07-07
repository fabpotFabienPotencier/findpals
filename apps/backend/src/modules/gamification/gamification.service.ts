import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class GamificationService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async addXp(userId: string, amount: number) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
            user.xp += amount;
            // Simple level up logic: Level = sqrt(XP) or something
            user.level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
            return this.userRepository.save(user);
        }
    }

    async getLeaderboard() {
        return this.userRepository.find({
            order: { xp: 'DESC' },
            take: 10,
            select: ['username', 'xp', 'level', 'id'] // Don't leak secrets
        });
    }
}
