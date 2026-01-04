import { isDev } from '@/shared/utils/is-dev.util';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { RedisStore } from 'connect-redis';
import { parse } from 'cookie';
import * as cookieSignature from 'cookie-signature';
import { Request, Response } from 'express';
import { join } from 'path';
import { RedisService } from '../redis/redis.service';

export function getGraphQLConfig(
  configService: ConfigService,
  redisService: RedisService,
): ApolloDriverConfig {
  const sessionStore = new RedisStore({
    client: redisService.getClient(),
    prefix: configService.getOrThrow<string>('SESSION_FOLDER'),
  });
  return {
    graphiql: isDev(configService),
    path: configService.getOrThrow<string>('GRAPHQL_PATH'),
    autoSchemaFile: join(process.cwd(), 'src/core/graphql/schema.gql'),
    sortSchema: true,
    context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    introspection: true,
    subscriptions: {
      'graphql-ws': {
        path: configService.getOrThrow<string>('GRAPHQL_SUBSCRIPTIONS_PATH'),
        onConnect: async (context: any) => {
          const connectionParams = context.connectionParams || {};
          const extra = context.extra || {};

          const cookies =
            extra.request?.headers?.cookie ||
            context.request?.headers?.cookie ||
            connectionParams?.headers?.cookie;

          const sessionName = configService.getOrThrow<string>('SESSION_NAME');

          if (!cookies) {
            console.log('WebSocket connection rejected: no cookies');
            return false;
          }

          if (!cookies.includes(sessionName + '=')) {
            console.log(
              `WebSocket connection rejected: session cookie '${sessionName}' not found in cookies`,
            );
            return false;
          }

          const parsedCookies = parse(cookies);
          const sessionCookieValue = parsedCookies[sessionName];

          if (!sessionCookieValue) {
            console.log(
              'WebSocket connection rejected: session cookie not found',
            );
            return false;
          }

          const sessionSecret =
            configService.getOrThrow<string>('SESSION_SECRET');
          let sessionId: string | null = null;

          if (sessionCookieValue.startsWith('s:')) {
            const signedValue = sessionCookieValue.substring(2);
            const unsigned = cookieSignature.unsign(signedValue, sessionSecret);
            sessionId = unsigned ? unsigned : null;
          } else {
            sessionId = sessionCookieValue;
          }

          if (!sessionId) {
            console.log(
              'WebSocket connection rejected: invalid session signature',
            );
            return false;
          }

          return new Promise((resolve) => {
            void sessionStore.get(sessionId, (err: any, sessionData: any) => {
              if (err) {
                console.error('Error loading session from store:', err);
                resolve(false);
                return;
              }

              if (!sessionData || !sessionData.userId) {
                console.log(
                  'WebSocket connection rejected: no userId in session data',
                );
                resolve(false);
                return;
              }

              // mock request с сессией для использования в guard
              const mockReq = {
                session: {
                  ...sessionData,
                  id: sessionId,
                  regenerate: (callback: (err?: any) => void) => callback(),
                  save: (callback: (err?: any) => void) => callback(),
                  destroy: (callback: (err?: any) => void) => callback(),
                  reload: (callback: (err?: any) => void) => callback(),
                  touch: (callback: (err?: any) => void) => callback(),
                },
                sessionID: sessionId,
              } as any;

              context.extra = {
                ...context.extra,
                request: mockReq,
              };

              resolve(true);
            });
          });
        },
      },
    },
  };
}
