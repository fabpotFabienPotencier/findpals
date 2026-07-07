import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

/**
 * StorageService for Cloudflare R2 (S3-compatible).
 * Uses native fetch + AWS Signature V4 to generate presigned upload URLs.
 * No @aws-sdk dependency needed — everything is done via REST.
 *
 * Frontend workflow:
 * 1. Frontend calls POST /upload/presign { filename, contentType }
 * 2. Backend returns { uploadUrl, publicUrl, key }
 * 3. Frontend PUTs the file directly to the R2 uploadUrl
 * 4. Frontend saves publicUrl to the relevant entity (post.mediaUrl, user.avatarUrl, etc.)
 */
@Injectable()
export class StorageService {
    private readonly accountId = process.env.R2_ACCOUNT_ID || '';
    private readonly accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    private readonly secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';
    private readonly bucketName = process.env.R2_BUCKET_NAME || 'findpals-media';
    private readonly publicUrl = process.env.R2_PUBLIC_URL || '';

    private get endpoint(): string {
        return `https://${this.accountId}.r2.cloudflarestorage.com`;
    }

    /**
     * Generate a presigned PUT URL for direct client-side upload to R2.
     * The URL is valid for the specified duration (default 10 minutes).
     */
    async generatePresignedUploadUrl(
        folder: string,
        filename: string,
        contentType: string,
        expiresInSeconds: number = 600,
    ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
        if (!this.accountId || !this.accessKeyId || !this.secretAccessKey) {
            throw new Error('R2 storage is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
        }

        // Generate a unique key to prevent overwrites
        const ext = filename.includes('.') ? filename.split('.').pop() : '';
        const uniqueId = crypto.randomBytes(8).toString('hex');
        const key = `${folder}/${uniqueId}${ext ? '.' + ext : ''}`;

        // AWS Signature V4 presigned URL generation
        const now = new Date();
        const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, '');
        const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
        const region = 'auto';
        const service = 's3';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const credential = `${this.accessKeyId}/${credentialScope}`;

        const host = `${this.bucketName}.${this.accountId}.r2.cloudflarestorage.com`;

        const canonicalQueryString = [
            `X-Amz-Algorithm=AWS4-HMAC-SHA256`,
            `X-Amz-Credential=${encodeURIComponent(credential)}`,
            `X-Amz-Date=${amzDate}`,
            `X-Amz-Expires=${expiresInSeconds}`,
            `X-Amz-SignedHeaders=content-type%3Bhost`,
        ].sort().join('&');

        const canonicalHeaders = `content-type:${contentType}\nhost:${host}\n`;
        const signedHeaders = 'content-type;host';

        const canonicalRequest = [
            'PUT',
            `/${key}`,
            canonicalQueryString,
            canonicalHeaders,
            signedHeaders,
            'UNSIGNED-PAYLOAD',
        ].join('\n');

        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
        ].join('\n');

        // Derive signing key
        const kDate = crypto.createHmac('sha256', `AWS4${this.secretAccessKey}`).update(dateStamp).digest();
        const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
        const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
        const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();

        const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

        const uploadUrl = `https://${host}/${key}?${canonicalQueryString}&X-Amz-Signature=${signature}`;

        return {
            uploadUrl,
            publicUrl: this.publicUrl ? `${this.publicUrl}/${key}` : `${this.endpoint}/${this.bucketName}/${key}`,
            key,
        };
    }
}
