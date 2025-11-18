import { User } from 'src/modules/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
