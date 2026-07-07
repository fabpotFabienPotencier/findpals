import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailService } from './email.service';
import { User } from '../../entities/user.entity';
import { Session } from '../../entities/session.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Session]),
        JwtModule.register({
            secret: process.env.JWT_SECRET,
            signOptions: { expiresIn: process.env.JWT_EXPIRY || '7d' },
        }),
    ],
    providers: [AuthService, EmailService],
    controllers: [AuthController],
    exports: [AuthService, JwtModule, EmailService],
})
export class AuthModule { }
