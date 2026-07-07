import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToMany, JoinTable } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class Chat {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    name: string; // Group name

    @Column({ default: false })
    isGroup: boolean;

    @ManyToMany(() => User)
    @JoinTable()
    participants: User[];

    @CreateDateColumn()
    createdAt: Date;
}

export { Message } from './message.entity'; // Re-export for convenience or remove if unused in module import
