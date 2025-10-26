import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreatePostInput } from './inputs/create-post.input';
import { FilterPostsInput } from './inputs/filter.input';
import { LikesPaginationInput } from './inputs/likes-pagination.input';
import { UpdatePostInput } from './inputs/update-post.input';
import { LikeResponseModel } from './models/like-response.model';
import { PaginatedLikedUsersModel } from './models/liked-users.model';
import { PostModel } from './models/post.model';
import { PostsService } from './posts.service';

@Resolver('Post')
export class PostsResolver {
  constructor(private readonly postsService: PostsService) {}

  @Auth()
  @Query(() => [PostModel], { name: 'findAllPosts' })
  public async findAll(
    @Args('filter') filterPostsInput: FilterPostsInput,
    @Authorized() user: any,
  ) {
    const userId = user.id;
    return this.postsService.findAll(filterPostsInput, userId);
  }

  @Query(() => PostModel, { name: 'findOneById' })
  public async findOneById(@Args('id') id: string) {
    return this.postsService.findOneById(id);
  }

  @Auth()
  @Query(() => [PostModel], { name: 'findAllByUsername' })
  public async findAllByUsername(
    @Args('username') username: string,
    @Args('filter') filterPostsInput: FilterPostsInput,
    @Authorized() user: any,
  ) {
    const userId = user.id;
    return this.postsService.findAllByUsername(
      username,
      filterPostsInput,
      userId,
    );
  }

  @Auth()
  @Query(() => [PostModel], { name: 'findAllByMe' })
  public async findAllByMe(
    @Args('filter') filterPostsInput: FilterPostsInput,
    @Authorized() user: any,
  ) {
    const userId = user.id;
    return this.postsService.findAllByMe(userId, filterPostsInput);
  }

  @Auth()
  @Query(() => [PostModel], { name: 'findAllByMeHidden' })
  public async findAllByMeHidden(
    @Args('filter') filterPostsInput: FilterPostsInput,
    @Authorized() user: any,
  ) {
    const userId = user.id;
    return this.postsService.findAllByMeHidden(userId, filterPostsInput);
  }

  @Query(() => PaginatedLikedUsersModel, { name: 'getLikedUsersByPost' })
  public async getLikedUsersByPost(
    @Args('postId') postId: string,
    @Args('pagination', { defaultValue: { skip: 0, take: 20 } })
    paginationInput: LikesPaginationInput,
  ) {
    return this.postsService.getLikedUsersByPost(postId, paginationInput);
  }

  @Auth()
  @Mutation(() => PostModel, { name: 'createPost' })
  public async createPost(
    @Authorized('id') userId: string,
    @Args('data') createPostInput: CreatePostInput,
  ) {
    return this.postsService.create(userId, createPostInput);
  }

  @Auth()
  @Mutation(() => PostModel, { name: 'updatePost' })
  public async updatePost(
    @Args('id') id: string,
    @Authorized('id') userId: string,
    @Args('data') updatePostInput: UpdatePostInput,
  ) {
    return this.postsService.update(id, userId, updatePostInput);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'deletePost' })
  public async deletePost(
    @Args('id') id: string,
    @Authorized('id') userId: string,
  ) {
    return this.postsService.delete(id, userId);
  }

  @Auth()
  @Mutation(() => LikeResponseModel, { name: 'toggleLikePost' })
  public async toggleLikePost(
    @Args('postId') postId: string,
    @Authorized('id') userId: string,
  ) {
    return this.postsService.toggleLike(postId, userId);
  }

  @Auth()
  @Mutation(() => PostModel, { name: 'toggleHidePost' })
  public async toggleHidePost(
    @Args('postId') postId: string,
    @Authorized('id') userId: string,
  ) {
    return this.postsService.toggleHide(postId, userId);
  }
}
