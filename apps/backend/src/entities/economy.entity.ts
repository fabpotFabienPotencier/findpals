import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Transaction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column()
    type: 'deposit' | 'withdrawal' | 'tip' | 'subscription';

    @Column({ nullable: true })
    reference: string | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    fromUser: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    toUser: User;

    @CreateDateColumn()
    createdAt: Date;
}

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    subscriber: User;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    creator: User;

    @Column()
    tier: string;

    @Column({ nullable: true })
    expiresAt: Date;
}
