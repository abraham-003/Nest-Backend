// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from 'src/shared/entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  /**
   * Register a new user
   */
  async register(dto: RegisterDto): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Create user using UsersService
    const user = await this.usersService.register(dto);

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(dto: LoginDto): Promise<{
    user: Omit<User, 'password'>;
    accessToken: string;
    refreshToken: string;
  }> {
    console.log('Login attempt for:', dto.email);

    const user = await this.usersService.findByEmail(dto.email);
    console.log('User found:', user ? 'Yes' : 'No');
    console.log('User object:', user);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    console.log('User password exists:', !!user.password);
    console.log('User password length:', user.password?.length);

    if (!user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Remove password from user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // Generate tokens
    const tokens = await this.generateTokens(userWithoutPassword);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresh tokens
   */
  async refresh(
    userId: number,
    oldRefreshToken: string,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify the old refresh token exists and is valid
    const storedToken = await this.refreshTokenRepository.findOne({
      where: {
        token: oldRefreshToken,
        user: { id: userId },
      },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      // Clean up expired token
      await this.refreshTokenRepository.delete(storedToken.id);
      throw new UnauthorizedException('Refresh token expired');
    }

    // Get user data
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from user object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    // Generate new tokens
    const newTokens = await this.generateTokens(userWithoutPassword);

    // Delete the old refresh token
    await this.refreshTokenRepository.delete(storedToken.id);

    return newTokens;
  }

  /**
   * Logout user (invalidate specific refresh token)
   */
  async logout(userId: number, refreshToken: string): Promise<void> {
    // Find and delete the specific refresh token
    const result = await this.refreshTokenRepository.delete({
      token: refreshToken,
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new NotFoundException('Refresh token not found');
    }
  }

  /**
   * Logout user from all devices (invalidate all refresh tokens)
   */
  async logoutAll(userId: number): Promise<void> {
    await this.refreshTokenRepository.delete({
      user: { id: userId },
    });
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: Omit<User, 'password'>): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    // The user object already has roles and permissions
    const roles = user.roles?.map((role) => role.name) || [];
    const permissions =
      user.roles
        ?.flatMap((role) => role.permissions.map((p) => p.name))
        .filter((v, i, a) => a.indexOf(v) === i) || [];

    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.storeRefreshToken(refreshToken, user.id);

    return { accessToken, refreshToken };
  }

  /**
   * Store refresh token in database
   */
  private async storeRefreshToken(
    token: string,
    userId: number,
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

    await this.refreshTokenRepository.save({
      token,
      user: { id: userId } as User,
      expiresAt,
    });
  }

  /**
   * Validate user by ID (for guards)
   */
  async validateUserById(
    userId: number,
  ): Promise<Omit<User, 'password'> | null> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
