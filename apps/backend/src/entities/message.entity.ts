import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string; // Encrypted content

    @Column({ default: 'text' })
    type: 'text' | 'image' | 'video' | 'file';

    @Column({ nullable: true })
    mediaUrl: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'senderId' })
    sender: User;

    @Column()
    senderId: string;

    @Column()
    chatId: string; // Identifier for 1:1 or Group Chat

    @Column({ default: false })
    isRead: boolean;
}
