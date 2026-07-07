import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LiveRoom, LiveAccess, LiveAccessMode } from '../../entities/live-room.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';

interface CreateRoomDto {
    title: string;
    accessMode: LiveAccessMode;
    price?: number;
    isRecordingRequested?: boolean;
}

@Injectable()
export class LiveRoomService {
    constructor(
        @InjectRepository(LiveRoom)
        private readonly liveRoomRepository: Repository<LiveRoom>,
        @InjectRepository(LiveAccess)
        private readonly liveAccessRepository: Repository<LiveAccess>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) { }

    async createRoom(hostId: string, dto: CreateRoomDto): Promise<LiveRoom> {
        const room = new LiveRoom();
        room.hostId = hostId;
        room.title = dto.title;
        room.accessMode = dto.accessMode;
        room.price = dto.price ?? 0;
        room.isRecordingRequested = !!dto.isRecordingRequested;
        return this.liveRoomRepository.save(room);
    }

    async validateJoin(roomId: string, userId: string): Promise<void> {
        const room = await this.liveRoomRepository.findOne({ where: { id: roomId } });
        if (!room) {
            throw new NotFoundException('Live room not found');
        }

        if (room.accessMode === 'public') {
            return;
        }

        if (room.hostId === userId) {
            return;
        }

        // For non-public modes, require an access record for now (followers/subscribers/PPV/invite-only abstracted as LiveAccess)
        const access = await this.liveAccessRepository.findOne({ where: { roomId, userId } });
        if (!access) {
            throw new ForbiddenException('Access to this live room is restricted');
        }
    }

    async tipAndGrantAccess(roomId: string, fromUserId: string, amount: number): Promise<{ success: boolean }> {
        const room = await this.liveRoomRepository.findOne({ where: { id: roomId } });
        if (!room) {
            throw new NotFoundException('Live room not found');
        }

        const fromUser = await this.userRepository.findOne({ where: { id: fromUserId } });
        const toUser = await this.userRepository.findOne({ where: { id: room.hostId } });
        if (!fromUser || !toUser) {
            throw new NotFoundException('User not found');
        }

        if (Number(fromUser.walletBalance) < amount) {
            throw new ForbiddenException('Insufficient wallet balance');
        }

        // Move funds between wallets
        fromUser.walletBalance = Number(fromUser.walletBalance) - amount;
        toUser.walletBalance = Number(toUser.walletBalance) + amount;
        await this.userRepository.save([fromUser, toUser]);

        const tx = new Transaction();
        tx.amount = amount;
        tx.type = 'tip';
        tx.fromUser = fromUser;
        tx.toUser = toUser;
        await this.transactionRepository.save(tx);

        // Grant access to room for PPV/subscriber/invite-only style access
        const existingAccess = await this.liveAccessRepository.findOne({ where: { roomId, userId: fromUserId } });
        if (!existingAccess) {
            const access = new LiveAccess();
            access.roomId = roomId;
            access.userId = fromUserId;
            await this.liveAccessRepository.save(access);
        }

        return { success: true };
    }

    async saveRecording(roomId: string, recordingUrl: string): Promise<LiveRoom> {
        const room = await this.liveRoomRepository.findOne({ where: { id: roomId } });
        if (!room) {
            throw new NotFoundException('Live room not found');
        }
        room.recordingUrl = recordingUrl;
        return this.liveRoomRepository.save(room);
    }
}


