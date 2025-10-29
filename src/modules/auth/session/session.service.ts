import { PrismaService } from '@/core/prisma/prisma.service';
import { ms, type StringValue } from '@/shared/utils/ms.util';
import { parseBoolean } from '@/shared/utils/parse-boolean.util';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify } from 'argon2';
import * as cookieSignature from 'cookie-signature';
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

      req.session.regenerate((err) => {
        if (err) {
          console.error('Session regenerate error:', err);
          return reject(
            new InternalServerErrorException('Не удалось создать сессию'),
          );
        }

        req.session.createdAt = new Date().toISOString();
        req.session.userId = String(user.id);

        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return reject(
              new InternalServerErrorException('Не удалось сохранить сессию'),
            );
          }

          if (req.res && req.sessionID) {
            const sessionName = this.config.getOrThrow<string>('SESSION_NAME');
            const sessionSecret =
              this.config.getOrThrow<string>('SESSION_SECRET');
            const sessionDomain = this.config.get<string>('SESSION_DOMAIN');
            const isSecure = parseBoolean(
              this.config.getOrThrow<string>('SESSION_SECURE'),
            );
            const httpOnly = parseBoolean(
              this.config.getOrThrow<string>('SESSION_HTTP_ONLY'),
            );
            const maxAge = ms(
              this.config.getOrThrow<string>('SESSION_MAX_AGE') as StringValue,
            );

            const signedSessionId =
              's:' + cookieSignature.sign(req.sessionID, sessionSecret);

            const cookieOptions: {
              domain?: string;
              secure?: boolean;
              sameSite?: 'lax' | 'strict' | 'none';
              httpOnly?: boolean;
              path?: string;
              maxAge?: number;
            } = {
              path: '/',
              httpOnly,
              secure: isSecure,
              sameSite: isSecure ? 'none' : 'lax',
              maxAge,
            };

            if (sessionDomain) {
              cookieOptions.domain = sessionDomain;
            }

            req.res.cookie(sessionName, signedSessionId, cookieOptions);
          }

          resolve(user);
        });
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

        // Необходимо передать те же параметры куки, что использовались при установке,
        // иначе браузер может не удалить куку (особенно важно для продакшена)
        const cookieOptions: {
          domain?: string;
          secure?: boolean;
          sameSite?: boolean | 'lax' | 'strict' | 'none';
          httpOnly?: boolean;
          path?: string;
        } = {};

        const domain = this.config.get<string>('SESSION_DOMAIN');
        if (domain) {
          cookieOptions.domain = domain;
        }

        const isSecure = parseBoolean(
          this.config.getOrThrow<string>('SESSION_SECURE'),
        );
        cookieOptions.secure = isSecure;
        cookieOptions.sameSite = isSecure ? 'none' : 'lax';
        cookieOptions.httpOnly = parseBoolean(
          this.config.getOrThrow<string>('SESSION_HTTP_ONLY'),
        );
        cookieOptions.path = '/';

        req.res?.clearCookie(
          this.config.getOrThrow<string>('SESSION_NAME'),
          cookieOptions,
        );
        return resolve(true);
      });
    });
  }
}
