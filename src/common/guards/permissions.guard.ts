import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>(
      'permissions',
      ctx.getHandler(),
    );
    if (!required) return true;

    // FIX: Explicitly type the request to avoid `any`
    const req = ctx.switchToHttp().getRequest<Request>();

    // FIX: Explicitly type the user
    const user = req.user as { permissions?: string[] } | undefined;

    const userPermissions = user?.permissions ?? [];

    return required.some((p) => userPermissions.includes(p));
  }
}
