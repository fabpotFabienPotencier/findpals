import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Session } from '../../entities/session.entity';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { EncryptionService } from './encryption.service';
import { EmailService } from './email.service';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
        private readonly jwtService: JwtService,
        private readonly emailService: EmailService,
    ) { }

    async register(
        username: string,
        password: string,
        email: string,
        mode: 'communication-only' | 'general',
        consent: boolean,
    ) {
        // Check for existing username
        const existingUsername = await this.userRepository.findOne({ where: { username } });
        if (existingUsername) {
            throw new ConflictException('Username is already taken');
        }

        // Check for existing email
        if (email) {
            const existingEmail = await this.userRepository.findOne({ where: { email } });
            if (existingEmail) {
                throw new ConflictException('Email is already registered');
            }
        }

        const user = new User();
        user.username = username;
        user.passwordHash = await bcrypt.hash(password, 12);
        user.email = email || null;
        user.mode = mode;
        user.hasConsented18Plus = consent;

        // Generate email verification token
        if (email) {
            user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }

        if (consent) {
            const consentLog = JSON.stringify({
                timestamp: new Date().toISOString(),
                action: 'CONSENT_18_PLUS',
                username: username,
            });
            user.encryptedConsentLog = EncryptionService.encrypt(consentLog);
        }

        const savedUser = await this.userRepository.save(user);

        // Send verification email (non-blocking — don't fail registration if email fails)
        if (email && user.emailVerificationToken) {
            this.emailService.sendVerificationEmail(email, user.emailVerificationToken).catch((err) => {
                console.error('[AuthService] Failed to send verification email:', err);
            });
        }

        return {
            id: savedUser.id,
            username: savedUser.username,
            email: savedUser.email,
            isEmailVerified: savedUser.isEmailVerified,
            mode: savedUser.mode,
        };
    }

    async verifyEmail(token: string) {
        const user = await this.userRepository.findOne({
            where: { emailVerificationToken: token },
        });

        if (!user) {
            throw new BadRequestException('Invalid verification token');
        }

        if (user.emailVerificationExpiry && user.emailVerificationExpiry < new Date()) {
            throw new BadRequestException('Verification token has expired. Please request a new one.');
        }

        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpiry = null;
        await this.userRepository.save(user);

        return { message: 'Email verified successfully' };
    }

    async resendVerificationEmail(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('User not found');
        if (!user.email) throw new BadRequestException('No email address on this account');
        if (user.isEmailVerified) throw new BadRequestException('Email is already verified');

        user.emailVerificationToken = crypto.randomBytes(32).toString('hex');
        user.emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await this.userRepository.save(user);

        await this.emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
        return { message: 'Verification email sent' };
    }

    async forgotPassword(email: string) {
        const user = await this.userRepository.findOne({ where: { email } });
        // Always return success to prevent email enumeration
        if (!user) {
            return { message: 'If an account with that email exists, a reset link has been sent.' };
        }

        user.passwordResetToken = crypto.randomBytes(32).toString('hex');
        user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await this.userRepository.save(user);

        await this.emailService.sendPasswordResetEmail(email, user.passwordResetToken);
        return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    async resetPassword(token: string, newPassword: string) {
        const user = await this.userRepository.findOne({
            where: { passwordResetToken: token },
        });

        if (!user) {
            throw new BadRequestException('Invalid reset token');
        }

        if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
            throw new BadRequestException('Reset token has expired. Please request a new one.');
        }

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        user.passwordResetToken = null;
        user.passwordResetExpiry = null;
        await this.userRepository.save(user);

        return { message: 'Password reset successfully' };
    }

    async login(username: string, password: string, twoFactorCode?: string, meta?: { ip?: string; userAgent?: string; deviceId?: string }) {
        const user = await this.userRepository.findOne({ where: { username } });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (user.twoFactorSecret) {
            if (!twoFactorCode || !authenticator.verify({ token: twoFactorCode, secret: user.twoFactorSecret })) {
                throw new UnauthorizedException('Invalid two-factor authentication code');
            }
        }

        // Create a session record for this login
        const session = new Session();
        session.userId = user.id;
        session.deviceId = meta?.deviceId ?? null;
        session.userAgent = meta?.userAgent ?? null;
        session.ipAddress = meta?.ip ?? null;
        const savedSession = await this.sessionRepository.save(session);

        const payload = { sub: user.id, username: user.username, sid: savedSession.id };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                mode: user.mode,
                isTwoFactorEnabled: !!user.twoFactorSecret,
            },
        };
    }

    async generateTwoFactorSecret(userId: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        const secret = authenticator.generateSecret();
        user.twoFactorSecret = secret;
        await this.userRepository.save(user);

        const otpauthUrl = authenticator.keyuri(user.username, 'findpals', secret);

        return { secret, otpauthUrl };
    }
}
