import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { FlutterwaveService } from './flutterwave.service';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly jwtService: JwtService,
        private readonly flutterwaveService: FlutterwaveService,
    ) { }

    @Post('flutterwave/initialize')
    async initializeFlutterwave(@Req() req: Request, @Body() body: any) {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);

        const amount = Number(body.amount);
        const currency = (body.currency || 'USD') as string;
        const redirectUrl = (body.redirectUrl || 'https://findpals.xyz') as string;

        return this.flutterwaveService.initializeWalletDeposit(payload.sub, amount, currency, redirectUrl);
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
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        const payload: any = this.jwtService.decode(token);
        return this.flutterwaveService.getUserTransactions(payload.sub);
    }
}


