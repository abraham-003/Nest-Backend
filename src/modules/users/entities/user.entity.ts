import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Role } from '../../../shared/entities/role.entity';
import { RefreshToken } from '../../../shared/entities/refresh-token.entity';

/**
 * This class represents the 'users' table in the database.
 * Each instance of this class is a row in the table.
 */
@Entity({ name: 'users' }) // Specifies the table name.
export class User {
  /**
   * The primary key for the user.
   * This is set to a number (auto-increment) to fix the type
   * errors in your AuthService and UsersService.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * The user's first name.
   */
  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  /**
   * The user's last name.
   */
  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  /**
   * The user's email address.
   */
  @Index()
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * A boolean flag to indicate if the user is active.
   */
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  /**
   * This column will automatically be set to the date and time
   * when the user is first created.
   */
  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  /**
   * This column will automatically be set to the date and time
   * whenever the user record is updated.
   */
  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;

  // --- FIELDS ADDED TO FIX COMPILATION ERRORS ---

  /**
   * The user's hashed password.
   * Added 'select: false' so it isn't returned by default in queries.
   * This fixes the 'user.password' error.
   */
  @Column({ select: false })
  password: string;

  /**
   * Many-to-Many relationship with Roles.
   * This fixes the 'user.roles' error.
   */
  @ManyToMany(() => Role, (role) => role.users)
  @JoinTable({
    name: 'user_roles', // name of the pivot table
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  /**
   * One-to-Many relationship with RefreshTokens.
   * This fixes the 'user.refreshTokens' error in other entities.
   */
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
