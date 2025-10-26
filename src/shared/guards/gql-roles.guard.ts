import { PrismaService } from '@/core/prisma/prisma.service';
import { ROLES_KEY } from '@/shared/decorators/roles.decorator';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from 'prisma/generated';

@Injectable()
export class GqlRolesGuard implements CanActivate {
  public constructor(
    private readonly reflector: Reflector,
    private readonly prismaService: PrismaService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req as {
      user?: { id: string; role?: Role };
      session?: { userId?: string };
    };

    // Ensure user is attached (by GqlAuthGuard) or load minimal user data by session
    let role: Role | undefined = req.user?.role;

    if (!role) {
      const userId = req.session?.userId;
      if (!userId) {
        throw new ForbiddenException('Доступ запрещён');
      }

      const user = await this.prismaService.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      role = user?.role;
    }

    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Недостаточно прав');
    }

    return true;
  }
}
