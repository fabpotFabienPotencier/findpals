import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { StorageController } from './storage.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [AuthModule], // Provides JwtModule for token verification
    providers: [StorageService],
    controllers: [StorageController],
    exports: [StorageService],
})
export class StorageModule { }
