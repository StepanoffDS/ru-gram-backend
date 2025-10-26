import { isDev } from '@/shared/utils/is-dev.util';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { join } from 'path';

export function getGraphQLConfig(
  configService: ConfigService,
): ApolloDriverConfig {
  return {
    graphiql: isDev(configService),
    path: configService.getOrThrow<string>('GRAPHQL_PATH'),
    autoSchemaFile: join(process.cwd(), 'src/core/graphql/schema.gql'),
    sortSchema: true,
    context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
  };
}
