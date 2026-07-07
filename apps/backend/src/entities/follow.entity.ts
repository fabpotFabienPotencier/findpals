import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
@Unique(['followerId', 'followingId'])
export class Follow {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'followerId' })
    follower: User;

    @Column()
    followerId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'followingId' })
    following: User;

    @Column()
    followingId: string;

    @CreateDateColumn()
    createdAt: Date;
}
