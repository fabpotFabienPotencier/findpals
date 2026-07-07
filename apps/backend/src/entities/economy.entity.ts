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

    @ManyToOne(() => User)
    fromUser: User;

    @ManyToOne(() => User)
    toUser: User;

    @CreateDateColumn()
    createdAt: Date;
}

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    subscriber: User;

    @ManyToOne(() => User)
    creator: User;

    @Column()
    tier: string;

    @Column({ nullable: true })
    expiresAt: Date;
}
