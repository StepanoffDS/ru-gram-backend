import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsResolver } from './posts.resolver';
import { PostsService } from './posts.service';

@Module({
  controllers: [PostsController],
  providers: [PostsResolver, PostsService],
})
export class PostsModule {}
