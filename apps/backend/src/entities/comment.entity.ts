import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity()
export class Comment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    content: string;

    @CreateDateColumn()
    createdAt: Date;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'authorId' })
    author: User;

    @Column()
    authorId: string;

    @ManyToOne(() => Post)
    @JoinColumn({ name: 'postId' })
    post: Post;

    @Column()
    postId: string;
}
