import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt'; // safer import
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from 'src/shared/entities/refresh-token.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.users.findByEmail(dto.email);
    if (exists) {
      throw new BadRequestException('Email already taken');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.users.create({
      ...dto,
      password: hashed,
    });

    return this.issueTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async issueTokens(user: User) {
    const payload = {
      sub: user.id,
      roles: user.roles?.map((r) => r.name) ?? [],
    };

    const accessToken = this.jwt.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwt.sign(payload, { expiresIn: '7d' });

    // remove old tokens
    await this.refreshTokens.delete({ user: { id: user.id } });

    // create new token entity safely
    const entity = this.refreshTokens.create({
      token: refreshToken,
      user: { id: user.id },
    });

    await this.refreshTokens.save(entity);

    return { accessToken, refreshToken };
  }

  async refresh(userId: number, token: string) {
    const stored = await this.refreshTokens.findOne({
      where: { token, user: { id: userId } },
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.users.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.issueTokens(user);
  }
  async logout(userId: number, refreshToken: string): Promise<void> {
    await this.refreshTokens.delete({
      user: { id: userId },
      token: refreshToken,
    });

    console.log(`User ${userId} logged out - token invalidated`);
  }
  async logoutAll(userId: number): Promise<void> {
    // Remove all refresh tokens for the user
    await this.refreshTokens.delete({ user: { id: userId } });

    console.log(`User ${userId} logged out from all devices`);
  }
}
