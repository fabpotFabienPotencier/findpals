import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export type PaymentProvider = 'flutterwave' | 'stripe';
export type PaymentPurpose = 'wallet_deposit' | 'subscription' | 'ppv';
export type PaymentStatus = 'initialized' | 'pending' | 'successful' | 'failed';

@Entity()
export class Payment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    userId: string;

    @Column({ type: 'varchar' })
    provider: PaymentProvider;

    @Column({ type: 'varchar' })
    purpose: PaymentPurpose;

    @Column('decimal', { precision: 10, scale: 2 })
    amount: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ unique: true })
    txRef: string;

    @Column({ nullable: true })
    providerTransactionId: string | null;

    @Column({ type: 'varchar', default: 'initialized' })
    status: PaymentStatus;

    @Column({ type: 'jsonb', nullable: true })
    raw: any;

    @CreateDateColumn()
    createdAt: Date;
}


