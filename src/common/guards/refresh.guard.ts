import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
@Injectable()
export class RefreshGuard extends AuthGuard('jwt-refresh') {
  // MUST match the parent class signature
  // MUST match the parent class signature
  override handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info: unknown,
    context: ExecutionContext,
    status?: unknown,
  ): TUser {
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return user;
  }
}
