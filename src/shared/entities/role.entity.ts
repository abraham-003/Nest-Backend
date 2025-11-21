import { User } from 'src/modules/users/entities/user.entity';
import { Permission } from './permission.entity';
import {
  Column,
  Entity,
  ManyToMany,
  PrimaryGeneratedColumn,
  JoinTable,
} from 'typeorm';

@Entity({ name: 'roles' })
export class Role {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  // Many-to-Many with Users (inverse side, no @JoinTable here)
  @ManyToMany(() => User, (user) => user.roles)
  users: User[];

  // Many-to-Many with Permissions (Role owns the table)
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({ name: 'role_permissions' })
  permissions: Permission[];
}
