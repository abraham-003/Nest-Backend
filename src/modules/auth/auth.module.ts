import { RefreshToken } from 'src/shared/entities/refresh-token.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { Module } from '@nestjs/common';

@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken, User])],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
