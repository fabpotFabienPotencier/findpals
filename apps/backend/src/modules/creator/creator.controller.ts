import { Controller, Post, Param, Body, Req, UnauthorizedException } from '@nestjs/common';
import { CreatorService } from './creator.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('creator')
export class CreatorController {
    constructor(
        private readonly creatorService: CreatorService,
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

    @Post(':id/tip')
    async tipCreator(@Req() req: Request, @Param('id') creatorId: string, @Body() body: { amount: number }) {
        const userId = this.extractUserId(req);
        return this.creatorService.tipUser(userId, creatorId, Number(body.amount) || 0);
    }
}
