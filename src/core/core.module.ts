import { AccountModule } from '@/modules/auth/account/account.module';
import { ProfileModule } from '@/modules/auth/profile/profile.module';
import { SessionModule } from '@/modules/auth/session/session.module';
import { StorageModule } from '@/modules/libs/storage/storage.module';
import { PostsModule } from '@/modules/posts/posts.module';
import { IS_DEV_ENV } from '@/shared/utils/is-dev.util';
import { ApolloDriver } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { getGraphQLConfig } from './config/graphql.config';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: !IS_DEV_ENV,
      isGlobal: true,
    }),
    GraphQLModule.forRootAsync({
      driver: ApolloDriver,
      imports: [ConfigModule],
      useFactory: getGraphQLConfig,
      inject: [ConfigService],
    }),
    PrismaModule,
    RedisModule,
    StorageModule,
    AccountModule,
    SessionModule,
    ProfileModule,
    PostsModule,
  ],
})
export class CoreModule {}
