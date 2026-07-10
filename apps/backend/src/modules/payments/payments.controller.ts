import { Body, Controller, Get, Post, Query, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { FlutterwaveService } from './flutterwave.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly jwtService: JwtService,
        private readonly flutterwaveService: FlutterwaveService,
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

    @Post('flutterwave/initialize')
    async initializeFlutterwave(@Req() req: Request, @Body() body: any) {
        const userId = this.extractUserId(req);

        const amount = Number(body.amount);
        const currency = (body.currency || 'USD') as string;
        const redirectUrl = (body.redirectUrl || 'https://findpals.xyz') as string;

        return this.flutterwaveService.initializeWalletDeposit(userId, amount, currency, redirectUrl);
    }

    // Optional: frontend can poll verify by tx_ref
    @Get('flutterwave/verify')
    async verifyFlutterwave(@Query('tx_ref') txRef: string) {
        return this.flutterwaveService.verifyAndApply(txRef);
    }

    // Webhook endpoint to be configured in Flutterwave dashboard
    @Post('flutterwave/webhook')
    async flutterwaveWebhook(@Req() req: Request, @Body() body: any) {
        const verifHash = req.headers['verif-hash'] as string | undefined;
        this.flutterwaveService.verifyWebhookSignature(verifHash);
        await this.flutterwaveService.handleWebhook(body);
        return { received: true };
    }

    @Get('transactions')
    async getMyTransactions(@Req() req: Request) {
        const userId = this.extractUserId(req);
        return this.flutterwaveService.getUserTransactions(userId);
    }

    @Post('withdraw')
    async withdraw(@Req() req: Request, @Body() body: { amount: number }) {
        const userId = this.extractUserId(req);
        return this.flutterwaveService.withdrawWallet(userId, Number(body.amount));
    }
}


