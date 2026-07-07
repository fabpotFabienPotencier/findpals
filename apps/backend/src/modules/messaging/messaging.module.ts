import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging.gateway';
import { Chat, Message } from '../../entities/chat.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Chat, Message])],
    providers: [MessagingService, MessagingGateway],
    exports: [MessagingService],
})
export class MessagingModule { }
