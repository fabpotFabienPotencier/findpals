import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../entities/session.entity';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly jwtService: JwtService,
        @InjectRepository(Session)
        private readonly sessionRepository: Repository<Session>,
    ) { }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(
            body.username,
            body.password,
            body.email,
            body.mode,
            body.consent,
        );
    }

    @Post('login')
    async login(@Body() body: any, @Req() req: Request) {
        const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
        const userAgent = req.headers['user-agent'] as string | undefined;
        const deviceId = body.deviceId as string | undefined;

        return this.authService.login(body.username, body.password, body.twoFactorCode, {
            ip,
            userAgent,
            deviceId,
        });
    }

    @Get('verify-email')
    async verifyEmail(@Query('token') token: string) {
        return this.authService.verifyEmail(token);
    }

    @Post('resend-verification')
    async resendVerification(@Req() req: Request) {
        const userId = this.extractUserId(req);
        return this.authService.resendVerificationEmail(userId);
    }

    @Post('forgot-password')
    async forgotPassword(@Body() body: any) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    async resetPassword(@Body() body: any) {
        return this.authService.resetPassword(body.token, body.newPassword);
    }

    @Post('2fa/setup')
    async setupTwoFactor(@Req() req: Request) {
        const userId = this.extractUserId(req);
        return this.authService.generateTwoFactorSecret(userId);
    }

    @Get('me')
    async getMe(@Req() req: Request) {
        const payload = this.extractPayload(req);
        // Return minimal user info from the JWT token
        return {
            id: payload.sub,
            username: payload.username,
            sessionId: payload.sid,
        };
    }

    @Get('sessions')
    async getSessions(@Req() req: Request) {
        const payload = this.extractPayload(req);
        const sessions = await this.sessionRepository.find({
            where: { userId: payload.sub },
            order: { createdAt: 'DESC' },
        });
        return sessions;
    }

    @Post('sessions/revoke')
    async revokeSession(@Req() req: Request, @Body() body: any) {
        const payload = this.extractPayload(req);
        const session = await this.sessionRepository.findOne({
            where: { id: body.sessionId, userId: payload.sub },
        });
        if (!session) {
            throw new Error('Session not found');
        }
        session.revoked = true;
        await this.sessionRepository.save(session);
        return { success: true };
    }

    // --- Helper methods to extract JWT data from Authorization header ---

    private extractPayload(req: Request): any {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }
        const [, token] = authHeader.split(' ');
        return this.jwtService.decode(token);
    }

    private extractUserId(req: Request): string {
        const payload = this.extractPayload(req);
        return payload.sub;
    }
}
