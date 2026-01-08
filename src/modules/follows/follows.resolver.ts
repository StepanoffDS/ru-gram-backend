import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { FollowsService } from './follows.service';
import { PaginatedUsersModel } from './models/paginated-users.model';

@Resolver('Follow')
export class FollowsResolver {
  public constructor(private readonly followsService: FollowsService) {}

  @Auth()
  @Mutation(() => Boolean, { name: 'followUser' })
  public async followUser(
    @Authorized('id') followerId: string,
    @Args('userId') followingId: string,
  ) {
    return await this.followsService.follow(followerId, followingId);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'unfollowUser' })
  public async unfollowUser(
    @Authorized('id') followerId: string,
    @Args('userId') followingId: string,
  ) {
    return await this.followsService.unfollow(followerId, followingId);
  }

  @Query(() => PaginatedUsersModel, { name: 'getFollowers' })
  public async getFollowers(
    @Args('userId') userId: string,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 20 }) take: number,
  ) {
    return await this.followsService.getFollowers(userId, skip, take);
  }

  @Query(() => PaginatedUsersModel, { name: 'getFollowing' })
  public async getFollowing(
    @Args('userId') userId: string,
    @Args('skip', { type: () => Int, defaultValue: 0 }) skip: number,
    @Args('take', { type: () => Int, defaultValue: 20 }) take: number,
  ) {
    return await this.followsService.getFollowing(userId, skip, take);
  }

  @Query(() => Int, { name: 'getFollowersCount' })
  public async getFollowersCount(@Args('userId') userId: string) {
    return await this.followsService.getFollowersCount(userId);
  }

  @Query(() => Int, { name: 'getFollowingCount' })
  public async getFollowingCount(@Args('userId') userId: string) {
    return await this.followsService.getFollowingCount(userId);
  }

  @Auth()
  @Query(() => Boolean, { name: 'isFollowing' })
  public async isFollowing(
    @Authorized('id') followerId: string,
    @Args('userId') followingId: string,
  ) {
    return await this.followsService.isFollowing(followerId, followingId);
  }
}
