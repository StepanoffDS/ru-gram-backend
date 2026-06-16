import { PrismaService } from '@/core/prisma/prisma.service';
import { NotificationsService } from '@/modules/notifications/notifications.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType } from 'prisma/generated';

@Injectable()
export class FollowsService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  public async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Нельзя подписаться на самого себя');
    }

    const followingUser = await this.prismaService.user.findUnique({
      where: { id: followingId },
    });

    if (!followingUser) {
      throw new NotFoundException('Пользователь не найден');
    }

    const existingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      throw new BadRequestException('Вы уже подписаны на этого пользователя');
    }

    await this.prismaService.follow.create({
      data: {
        followerId,
        followingId,
      },
    });

    await this.notificationsService.createNotification({
      recipientId: followingId,
      actorId: followerId,
      type: NotificationType.NEW_FOLLOWER,
    });

    return true;
  }

  public async unfollow(followerId: string, followingId: string) {
    const existingFollow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (!existingFollow) {
      throw new BadRequestException('Вы не подписаны на этого пользователя');
    }

    await this.prismaService.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return true;
  }

  public async getFollowers(
    userId: string,
    skip: number = 0,
    take: number = 20,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const total = await this.prismaService.follow.count({
      where: { followingId: userId },
    });

    const follows = await this.prismaService.follow.findMany({
      where: { followingId: userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    const followers = follows.map((follow) => ({
      ...follow.follower,
      followedAt: follow.createdAt,
    }));

    return {
      data: followers,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  public async getFollowing(
    userId: string,
    skip: number = 0,
    take: number = 20,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const total = await this.prismaService.follow.count({
      where: { followerId: userId },
    });

    const follows = await this.prismaService.follow.findMany({
      where: { followerId: userId },
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    const following = follows.map((follow) => ({
      ...follow.following,
      followedAt: follow.createdAt,
    }));

    return {
      data: following,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  public async getFollowersCount(userId: string): Promise<number> {
    return await this.prismaService.follow.count({
      where: { followingId: userId },
    });
  }

  public async getFollowingCount(userId: string): Promise<number> {
    return await this.prismaService.follow.count({
      where: { followerId: userId },
    });
  }

  public async isFollowing(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    const follow = await this.prismaService.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  public async getFollowingIds(followerId: string): Promise<string[]> {
    const follows = await this.prismaService.follow.findMany({
      where: { followerId },
      select: {
        followingId: true,
      },
    });

    return follows.map((follow) => follow.followingId);
  }
}
