import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('gamification')
export class GamificationController {
    constructor(
        private readonly gamificationService: GamificationService,
        private readonly jwtService: JwtService,
    ) { }

    private extractUserId(req: Request): string {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new UnauthorizedException('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        try {
            const payload: any = this.jwtService.verify(token);
            return payload.sub;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    @Get('leaderboard')
    async getLeaderboard(@Req() req: Request) {
        this.extractUserId(req); // Ensure user is authenticated
        return this.gamificationService.getLeaderboard();
    }
}
