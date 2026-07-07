import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global() // Global so every module can inject CacheService without importing CacheModule
@Module({
    providers: [CacheService],
    exports: [CacheService],
})
export class CacheModule { }
