import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreatorService } from './creator.service';
import { User } from '../../entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([User])],
    providers: [CreatorService],
    exports: [CreatorService],
})
export class CreatorModule { }
