import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../../entities/message.entity';
import { EncryptionService } from '../auth/encryption.service';

@Injectable()
export class MessagingService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
    ) { }

    async saveMessage(senderId: string, chatId: string, content: string, type: 'text' | 'image' | 'video' | 'file' = 'text'): Promise<Message> {
        const message = new Message();
        message.senderId = senderId;
        message.chatId = chatId;
        // content is expected to be already encrypted by client in E2E scenario, 
        // but if we are doing server-side encryption as per EncryptionService:
        message.content = EncryptionService.encrypt(content);
        message.type = type;

        return this.messageRepository.save(message);
    }

    async getMessages(chatId: string): Promise<Message[]> {
        const messages = await this.messageRepository.find({
            where: { chatId },
            order: { createdAt: 'ASC' },
            relations: ['sender']
        });

        return messages.map(msg => ({
            ...msg,
            content: EncryptionService.decrypt(msg.content)
        }));
    }
}
