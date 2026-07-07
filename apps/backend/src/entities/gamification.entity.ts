import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Badge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    iconUrl: string;
}

@Entity()
export class UserBadge {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    @ManyToOne(() => Badge)
    badge: Badge;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    earnedAt: Date;
}

@Entity()
export class UserProgression {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => User)
    user: User;

    // Add other progression stats here
}
