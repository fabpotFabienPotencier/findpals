import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorService } from './creator.service';
import { CreatorController } from './creator.controller';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Transaction]),
        AuthModule,
    ],
    controllers: [CreatorController],
    providers: [CreatorService],
    exports: [CreatorService],
})
export class CreatorModule { }
