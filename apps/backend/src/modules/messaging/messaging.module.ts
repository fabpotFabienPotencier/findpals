import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { MessagingController } from './messaging.controller';
import { Chat, Message } from '../../entities/chat.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Chat, Message]),
        AuthModule
    ],
    controllers: [MessagingController],
    providers: [MessagingService, MessagingGateway],
    exports: [MessagingService],
})
export class MessagingModule { }
