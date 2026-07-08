import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './user.entity';
import { Post } from './feed.entity';

@Entity('likes')
@Unique(['userId', 'postId'])
export class Like {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    @Column()
    postId: string;

    @ManyToOne(() => Post, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'postId' })
    post: Post;

    @CreateDateColumn()
    createdAt: Date;
}
