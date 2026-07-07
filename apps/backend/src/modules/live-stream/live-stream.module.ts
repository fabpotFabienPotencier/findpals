import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LiveStreamGateway, LiveStreamService } from './live-stream.gateway';
import { LiveRoomService } from './live-room.service';
import { LiveStreamController } from './live-stream.controller';
import { LiveRoom, LiveAccess } from '../../entities/live-room.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([LiveRoom, LiveAccess, User, Transaction]),
        AuthModule, // Provides JwtModule needed by LiveStreamController
    ],
    providers: [LiveStreamGateway, LiveStreamService, LiveRoomService],
    controllers: [LiveStreamController],
    exports: [LiveStreamService, LiveRoomService],
})
export class LiveStreamModule { }
