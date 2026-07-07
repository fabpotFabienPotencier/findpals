import { Injectable } from '@nestjs/common';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
}

@Injectable()
export class EmailService {
    private readonly apiKey = process.env.RESEND_API_KEY;
    private readonly fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@findpals.xyz';
    private readonly accountUrl = process.env.ACCOUNT_URL || 'https://account.findpals.xyz';

    private async send(options: SendEmailOptions): Promise<boolean> {
        if (!this.apiKey) {
            console.warn('[EmailService] RESEND_API_KEY not set — skipping email send in development');
            console.log(`[EmailService] Would have sent email to ${options.to}: ${options.subject}`);
            return false;
        }

        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    from: `findpals <${this.fromEmail}>`,
                    to: [options.to],
                    subject: options.subject,
                    html: options.html,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error(`[EmailService] Resend API error: ${res.status} ${text}`);
                return false;
            }

            return true;
        } catch (error) {
            console.error('[EmailService] Failed to send email:', error);
            return false;
        }
    }

    async sendVerificationEmail(email: string, token: string): Promise<boolean> {
        const verifyUrl = `${this.accountUrl}/verify?token=${encodeURIComponent(token)}`;

        return this.send({
            to: email,
            subject: 'Verify your findpals account',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0a0b1e; color: #e0e0e0; padding: 40px; border-radius: 16px;">
                    <h1 style="color: #00ff9d; text-align: center; font-size: 28px; margin-bottom: 8px;">findpals</h1>
                    <p style="text-align: center; color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Identity Verification</p>
                    
                    <p style="color: #ccc; line-height: 1.6;">Click the button below to verify your email address and activate your account.</p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${verifyUrl}" style="display: inline-block; background: #00ff9d; color: #000; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            VERIFY EMAIL
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
                    <p style="color: #444; font-size: 11px; margin-top: 24px; text-align: center;">This link expires in 24 hours.</p>
                </div>
            `,
        });
    }

    async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
        const resetUrl = `${this.accountUrl}/reset-password?token=${encodeURIComponent(token)}`;

        return this.send({
            to: email,
            subject: 'Reset your findpals password',
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; background: #0a0b1e; color: #e0e0e0; padding: 40px; border-radius: 16px;">
                    <h1 style="color: #00ff9d; text-align: center; font-size: 28px; margin-bottom: 8px;">findpals</h1>
                    <p style="text-align: center; color: #888; font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px;">Password Reset</p>
                    
                    <p style="color: #ccc; line-height: 1.6;">You requested a password reset. Click the button below to set a new password.</p>
                    
                    <div style="text-align: center; margin: 32px 0;">
                        <a href="${resetUrl}" style="display: inline-block; background: #d600ff; color: #fff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
                            RESET PASSWORD
                        </a>
                    </div>
                    
                    <p style="color: #666; font-size: 12px;">If you didn't request this, you can safely ignore this email.</p>
                    <p style="color: #444; font-size: 11px; margin-top: 24px; text-align: center;">This link expires in 1 hour.</p>
                </div>
            `,
        });
    }
}
