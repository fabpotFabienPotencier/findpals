import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';

type FlutterwaveInitializeResponse = {
    status: string;
    message: string;
    data: { link: string };
};

type FlutterwaveVerifyResponse = {
    status: string;
    message: string;
    data: {
        id: number;
        tx_ref: string;
        flw_ref: string;
        status: 'successful' | 'failed' | 'cancelled';
        amount: number;
        currency: string;
    };
};

@Injectable()
export class FlutterwaveService {
    private readonly baseUrl = process.env.FLUTTERWAVE_API_URL || 'https://api.flutterwave.com/v3';
    private readonly secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    private readonly webhookHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || '';

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepository: Repository<Payment>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Transaction)
        private readonly transactionRepository: Repository<Transaction>,
    ) { }

    private async flwFetch<T>(path: string, init?: RequestInit): Promise<T> {
        if (!this.secretKey) throw new Error('Missing FLUTTERWAVE_SECRET_KEY');
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...init,
            headers: {
                Authorization: `Bearer ${this.secretKey}`,
                'Content-Type': 'application/json',
                ...(init?.headers || {}),
            },
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Flutterwave error: ${res.status} ${text}`);
        }
        return (await res.json()) as T;
    }

    async initializeWalletDeposit(userId: string, amount: number, currency: string, redirectUrl: string) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const txRef = `dv_${userId}_${Date.now()}`;
        const payment = new Payment();
        payment.userId = userId;
        payment.provider = 'flutterwave';
        payment.purpose = 'wallet_deposit';
        payment.amount = amount;
        payment.currency = currency;
        payment.txRef = txRef;
        payment.status = 'initialized';
        await this.paymentRepository.save(payment);

        const payload = {
            tx_ref: txRef,
            amount,
            currency,
            redirect_url: redirectUrl,
            customer: {
                email: `${user.username}@findpals.xyz`,
                name: user.username,
            },
            meta: { userId, purpose: 'wallet_deposit' },
            customizations: {
                title: 'findpals Wallet Top-up',
                description: 'Deposit funds into your findpals wallet',
            },
        };

        const resp = await this.flwFetch<FlutterwaveInitializeResponse>('/payments', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        payment.status = 'pending';
        payment.raw = resp;
        await this.paymentRepository.save(payment);

        return { txRef, link: resp.data.link };
    }

    verifyWebhookSignature(verifHashHeader: string | undefined) {
        if (!this.webhookHash) {
            // allow in dev, but not in prod
            return;
        }
        if (!verifHashHeader || verifHashHeader !== this.webhookHash) {
            throw new UnauthorizedException('Invalid webhook signature');
        }
    }

    async verifyAndApply(txRef: string) {
        const payment = await this.paymentRepository.findOne({ where: { txRef } });
        if (!payment) throw new Error('Payment not found');

        const resp = await this.flwFetch<FlutterwaveVerifyResponse>(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`, {
            method: 'GET',
        });

        payment.raw = resp;
        payment.providerTransactionId = String(resp.data.id);

        if (resp.data.status === 'successful') {
            payment.status = 'successful';
            await this.paymentRepository.save(payment);
            await this.creditWalletIfNeeded(payment);
        } else {
            payment.status = 'failed';
            await this.paymentRepository.save(payment);
        }

        return payment;
    }

    async handleWebhook(body: any) {
        // Flutterwave sends tx_ref inside data
        const txRef: string | undefined = body?.data?.tx_ref;
        if (!txRef) return;

        // Re-verify to avoid trusting the webhook payload blindly
        await this.verifyAndApply(txRef);
    }

    private async creditWalletIfNeeded(payment: Payment) {
        if (payment.purpose !== 'wallet_deposit') return;

        const user = await this.userRepository.findOne({ where: { id: payment.userId } });
        if (!user) return;

        // Idempotency: if a deposit transaction already exists for this payment, don't double-credit
        const existing = await this.transactionRepository.findOne({ where: { reference: payment.txRef } });
        if (existing) return;

        user.walletBalance = Number(user.walletBalance) + Number(payment.amount);
        await this.userRepository.save(user);

        const tx = new Transaction();
        tx.amount = payment.amount;
        tx.type = 'deposit';
        tx.reference = payment.txRef;
        tx.fromUser = user;
        tx.toUser = user;
        await this.transactionRepository.save(tx);
    }

    async getUserTransactions(userId: string) {
        return this.transactionRepository.find({
            where: [
                { fromUser: { id: userId } },
                { toUser: { id: userId } }
            ],
            relations: ['fromUser', 'toUser'],
            order: { createdAt: 'DESC' },
            take: 20
        });
    }

    async withdrawWallet(userId: string, amount: number) {
        if (amount <= 0) throw new Error('Amount must be positive');
        
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) throw new Error('User not found');
        
        const currentBalance = Number(user.walletBalance);
        if (currentBalance < amount) throw new Error('Insufficient wallet balance');
        
        // Deduct balance first
        user.walletBalance = currentBalance - amount;
        await this.userRepository.save(user);
        
        const txRef = `withdrawal_${userId}_${Date.now()}`;
        
        // Execute real transfer request via Flutterwave payout API (sandbox access bank details)
        try {
            await this.flwFetch<any>('/transfers', {
                method: 'POST',
                body: JSON.stringify({
                    account_bank: "044", // Access Bank
                    account_number: "0690000032", // Sandbox success account
                    amount: amount,
                    narration: `findpals wallet withdrawal - ${user.username}`,
                    currency: "NGN",
                    reference: txRef,
                    debit_currency: "NGN"
                }),
            });
        } catch (error: any) {
            // Rollback balance on failure
            user.walletBalance = currentBalance;
            await this.userRepository.save(user);
            throw new Error(`Payout failed: ${error.message || error}`);
        }

        const tx = new Transaction();
        tx.amount = amount;
        tx.type = 'withdrawal';
        tx.reference = txRef;
        tx.fromUser = user;
        tx.toUser = user;
        await this.transactionRepository.save(tx);
        
        return { success: true, balance: user.walletBalance };
    }
}


