import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { RedisStore } from 'connect-redis';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import * as graphqlUpload from 'graphql-upload/graphqlUploadExpress.js';
import { CoreModule } from './core/core.module';
import { RedisService } from './core/redis/redis.service';
import { ms, type StringValue } from './shared/utils/ms.util';
import { parseBoolean } from './shared/utils/parse-boolean.util';

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);

  const configService = app.get(ConfigService);
  const redisService = app.get(RedisService);

  app.use(cookieParser(configService.getOrThrow<string>('COOKIE_SECRET')));
  app.use(configService.getOrThrow<string>('GRAPHQL_PATH'), graphqlUpload());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  try {
    await redisService.connect();
  } catch (err: unknown) {
    console.error('Failed to connect to Redis:', err);
    process.exit(1);
  }

  app.use(
    session({
      secret: configService.getOrThrow<string>('SESSION_SECRET'),
      name: configService.getOrThrow<string>('SESSION_NAME'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        domain: configService.getOrThrow<string>('SESSION_DOMAIN'),
        maxAge: ms(configService.getOrThrow<StringValue>('SESSION_MAX_AGE')),
        httpOnly: parseBoolean(
          configService.getOrThrow<string>('SESSION_HTTP_ONLY'),
        ),
        secure: parseBoolean(
          configService.getOrThrow<string>('SESSION_SECURE'),
        ),
        sameSite: 'lax',
      },
      store: new RedisStore({
        client: redisService.getClient(),
        prefix: configService.getOrThrow<string>('SESSION_FOLDER'),
      }),
    }),
  );

  app.enableCors({
    origin: configService.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['Set-Cookie'],
  });

  await app.listen(configService.getOrThrow<number>('APPLICATION_PORT'));
}
void bootstrap();
