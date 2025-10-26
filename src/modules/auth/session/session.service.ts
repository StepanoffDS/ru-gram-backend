import { PrismaService } from '@/core/prisma/prisma.service';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import type { Request } from 'express';
import { LoginInput } from './inputs/login.input';

@Injectable()
export class SessionService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly config: ConfigService,
  ) {}

  public async login(req: Request, loginInput: LoginInput) {
    const { login, password } = loginInput;

    const user = await this.prismaService.user.findFirst({
      where: {
        OR: [{ username: login }, { email: login }],
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный пароль');
    }

    return new Promise((resolve, reject) => {
      req.session.createdAt = new Date().toISOString();
      req.session.userId = String(user.id);

      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return reject(
            new InternalServerErrorException('Не удалось сохранить сессию'),
          );
        }

        resolve(user);
      });
    });
  }

  public async logout(req: Request) {
    return new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          return reject(
            new InternalServerErrorException('Не удалось завершить сессию'),
          );
        }

        req.res?.clearCookie(this.config.getOrThrow<string>('SESSION_NAME'));
        return resolve(true);
      });
    });
  }
}
