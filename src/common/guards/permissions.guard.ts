// permissions.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { User } from 'src/modules/users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private dataSource: DataSource,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: number };

    if (!user) return false;

    // Fetch user's roles with permissions
    const userWithRoles = await this.dataSource.getRepository(User).findOne({
      where: { id: user.id },
      relations: ['roles', 'roles.permissions'],
    });

    if (!userWithRoles) return false;

    const userPermissions = userWithRoles.roles
      .flatMap((role) => role.permissions)
      .map((permission) => permission.name);

    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.includes(p),
    );
    if (!hasPermission) throw new ForbiddenException('Access denied');

    return true;
  }
}
