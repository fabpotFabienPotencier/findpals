import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';

@Injectable()
export class CreatorService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
        private readonly entityManager: EntityManager,
    ) { }

    async tipUser(fromUserId: string, toUserId: string, amount: number) {
        if (amount <= 0) throw new Error('Tip amount must be positive');
        if (fromUserId === toUserId) throw new Error('Cannot tip yourself');
        
        return this.entityManager.transaction(async manager => {
            const fromUser = await manager.findOne(User, {
                where: { id: fromUserId },
                lock: { mode: 'pessimistic_write' },
            });
            const toUser = await manager.findOne(User, {
                where: { id: toUserId },
                lock: { mode: 'pessimistic_write' },
            });

            if (!fromUser || !toUser) throw new Error('User not found');
            if (Number(fromUser.walletBalance) < amount) throw new Error('Insufficient funds');

            fromUser.walletBalance = Number(fromUser.walletBalance) - amount;
            toUser.walletBalance = Number(toUser.walletBalance) + amount;

            await manager.save(User, fromUser);
            await manager.save(User, toUser);

            const tx = new Transaction();
            tx.amount = amount;
            tx.type = 'tip';
            tx.fromUser = fromUser;
            tx.toUser = toUser;
            await manager.save(Transaction, tx);

            return { success: true, newBalance: fromUser.walletBalance };
        });
    }
}
