import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string; // Pseudonymous / anonymous

    @Column({ unique: true, nullable: true })
    email: string;

    @Column({ default: false })
    isEmailVerified: boolean;

    @Column({ nullable: true })
    emailVerificationToken: string;

    @Column({ nullable: true })
    emailVerificationExpiry: Date;

    @Column({ nullable: true })
    passwordResetToken: string;

    @Column({ nullable: true })
    passwordResetExpiry: Date;

    @Column({ nullable: true })
    passwordHash: string;

    @Column({ default: false })
    isBurner: boolean;

    @Column({ type: 'jsonb', nullable: true })
    deviceIdentities: any[]; // Cryptographic identity per device

    @Column({ default: false })
    hasConsented18Plus: boolean;

    @Column({ type: 'text', nullable: true })
    encryptedConsentLog: string; // AES-256 encrypted consent

    @Column({ default: 'communication-only' })
    mode: 'communication-only' | 'general';

    @Column({ nullable: true })
    twoFactorSecret: string; // Base32 secret for TOTP

    // Profile fields
    @Column({ nullable: true })
    displayName: string;

    @Column({ type: 'text', nullable: true })
    bio: string;

    @Column({ nullable: true })
    avatarUrl: string; // Cloudflare R2 URL

    @Column({ default: false })
    isCreator: boolean;

    // Gamification
    @Column({ default: 0 })
    xp: number;

    @Column({ default: 1 })
    level: number;

    // Economy
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    walletBalance: number;

    // Social counts (denormalized for performance)
    @Column({ default: 0 })
    followersCount: number;

    @Column({ default: 0 })
    followingCount: number;

    @Column({ default: 0 })
    postsCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
