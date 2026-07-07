import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';

@Injectable()
export class CreatorService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async tipUser(fromUserId: string, toUserId: string, amount: number) {
        const fromUser = await this.userRepository.findOne({ where: { id: fromUserId } });
        const toUser = await this.userRepository.findOne({ where: { id: toUserId } });

        if (!fromUser || !toUser) throw new Error('User not found');
        if (fromUser.walletBalance < amount) throw new Error('Insufficient funds');

        fromUser.walletBalance = Number(fromUser.walletBalance) - amount;
        toUser.walletBalance = Number(toUser.walletBalance) + amount;

        await this.userRepository.save([fromUser, toUser]);
        // In real app, create Transaction record here
        return { success: true, newBalance: fromUser.walletBalance };
    }
}
