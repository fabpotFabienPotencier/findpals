import { Controller, Post, Body, Req, UnauthorizedException } from '@nestjs/common';
import { StorageService } from './storage.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Controller('upload')
export class StorageController {
    constructor(
        private readonly storageService: StorageService,
        private readonly jwtService: JwtService,
    ) { }

    @Post('presign')
    async getPresignedUrl(@Req() req: Request, @Body() body: any) {
        // Verify authenticated user
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new UnauthorizedException('Missing Authorization header');
        const [, token] = authHeader.split(' ');
        try {
            const payload: any = this.jwtService.verify(token);
            if (!payload?.sub) throw new UnauthorizedException('Invalid token');
            
            const folder = body.folder || 'uploads';
            const filename = body.filename || 'file';
            const contentType = body.contentType || 'application/octet-stream';

            // Validate folder to prevent path traversal
            const allowedFolders = ['avatars', 'posts', 'messages', 'live-recordings', 'uploads'];
            const safeFolder = allowedFolders.includes(folder) ? folder : 'uploads';

            const result = await this.storageService.generatePresignedUploadUrl(
                safeFolder,
                filename,
                contentType,
            );

            return result;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
