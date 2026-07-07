import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';

export type LiveAccessMode = 'public' | 'private' | 'followers' | 'subscribers' | 'ppv' | 'invite-only';

@Entity()
export class LiveRoom {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'hostId' })
    host: User;

    @Column()
    hostId: string;

    @Column({ type: 'varchar' })
    accessMode: LiveAccessMode;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price: number;

    @Column({ default: false })
    isRecordingRequested: boolean;

    @Column({ nullable: true })
    recordingUrl: string | null;

    @CreateDateColumn()
    createdAt: Date;
}

@Entity()
export class LiveAccess {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => LiveRoom)
    @JoinColumn({ name: 'roomId' })
    room: LiveRoom;

    @Column()
    roomId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @CreateDateColumn()
    createdAt: Date;
}


