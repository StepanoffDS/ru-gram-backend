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
    const gqlContext = ctx.getContext();

    const req = gqlContext.req || gqlContext.extra?.request;

    if (!req || !req.session) {
      console.log('GqlAuthGuard: req or session missing');
      throw new UnauthorizedException('Пользователь не авторизован');
    }

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

    if (gqlContext.extra && !gqlContext.req) {
      gqlContext.extra.request = req;
    }

    return true;
  }
}
