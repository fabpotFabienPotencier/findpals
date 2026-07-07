import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller';
import { FlutterwaveService } from './flutterwave.service';
import { Payment } from '../../entities/payment.entity';
import { User } from '../../entities/user.entity';
import { Transaction } from '../../entities/economy.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Payment, User, Transaction]),
        AuthModule, // Re-uses JwtModule exported from AuthModule — single source of truth for JWT config
    ],
    controllers: [PaymentsController],
    providers: [FlutterwaveService],
    exports: [FlutterwaveService],
})
export class PaymentsModule { }
