import { Role } from './role.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  // Many-to-Many with Roles
  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
