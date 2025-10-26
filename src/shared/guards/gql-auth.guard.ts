import { PrismaService } from '@/core/prisma/prisma.service';
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class GqlAuthGuard implements CanActivate {
  public constructor(private readonly prismaService: PrismaService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().req;

    if (typeof req.session.userId === 'undefined') {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const user = await this.prismaService.user.findUnique({
      where: {
        id: req.session.userId,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    req.user = user;

    return true;
  }
}
