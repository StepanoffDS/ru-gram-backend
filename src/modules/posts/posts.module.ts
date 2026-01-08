import { FollowsModule } from '@/modules/follows/follows.module';
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

@Module({
  imports: [FollowsModule],
  controllers: [PostsController],
  providers: [PostsResolver, PostsService],
})
export class PostsModule {}
