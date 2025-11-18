import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Get,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshGuard } from '../../common/guards/refresh.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthRequest } from 'src/types/auth-user.interface';

/**
 * Authentication Controller
 * Handles user registration, login, token refresh, and logout operations
 */
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /**
   * Register a new user account
   * @param dto - User registration data
   * @returns User data with access and refresh tokens
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterDto) {
    try {
      const result = await this.auth.register(dto);

      return {
        success: true,
        message: 'User registered successfully',
        data: result,
      };
    } catch (error) {
      // Re-throw the error to let NestJS handle it
      throw error;
    }
  }

  /**
   * Authenticate user and return tokens
   * @param dto - User login credentials
   * @returns User data with access and refresh tokens
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    try {
      const result = await this.auth.login(dto);

      return {
        success: true,
        message: 'Login successful',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token using a valid refresh token
   * @param req - Request object containing user data from refresh token
   * @returns New access and refresh tokens
   */
  @UseGuards(RefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: AuthRequest) {
    try {
      const { sub, refreshToken } = req.user;
      const result = await this.auth.refresh(sub, refreshToken ?? '');

      return {
        success: true,
        message: 'Tokens refreshed successfully',
        data: result,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user and invalidate refresh tokens
   * Using RefreshGuard to get the specific token to invalidate
   * @param req - Request object containing user data
   * @returns Success message
   */
  @Post('logout')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: AuthRequest) {
    try {
      const { sub, refreshToken } = req.user;

      // Use the specific refresh token for logout
      await this.auth.logout(sub, refreshToken ?? '');

      return {
        success: true,
        message: 'Logged out successfully',
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user from all devices (invalidate all refresh tokens)
   * @param req - Request object containing user data from JWT
   * @returns Success message
   */
  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: AuthRequest) {
    try {
      const userId = req.user.sub;
      await this.auth.logoutAll(userId);

      return {
        success: true,
        message: 'Logged out from all devices successfully',
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current authenticated user's profile
   * @param req - Request object containing user data from JWT
   * @returns User profile data
   */
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getProfile(@Req() req: AuthRequest) {
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: req.user,
      },
    };
  }

  /**
   * Validate current access token
   * @param req - Request object containing user data from JWT
   * @returns Token validation status and user data
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateToken(@Req() req: AuthRequest) {
    return {
      success: true,
      message: 'Token is valid',
      data: {
        valid: true,
        user: req.user,
      },
    };
  }

  /**
   * Health check endpoint for authentication service
   * @returns Service status
   */
  @Get('health')
  @HttpCode(HttpStatus.OK)
  async healthCheck() {
    return {
      success: true,
      message: 'Authentication service is running',
      data: {
        service: 'auth',
        status: 'healthy',
        timestamp: new Date().toISOString(),
      },
    };
  }
}
