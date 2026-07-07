import * as crypto from 'crypto';

export class EncryptionService {
    private static readonly algorithm = 'aes-256-cbc';

    private static getKey(): Buffer {
        const secret = process.env.ENCRYPTION_SECRET;
        if (!secret) {
            throw new Error(
                'FATAL: ENCRYPTION_SECRET environment variable is not set. ' +
                'This is required for AES-256 encryption. Generate a 32+ character random string.'
            );
        }
        return crypto.scryptSync(secret, 'findpals-salt-v1', 32);
    }

    static encrypt(text: string): string {
        const key = this.getKey();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return `${iv.toString('hex')}:${encrypted}`;
    }

    static decrypt(encryptedData: string): string {
        const key = this.getKey();
        const [ivHex, encryptedText] = encryptedData.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}
