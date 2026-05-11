import { PrismaService } from '@/core/prisma/prisma.service';
import { RedisPubSubService } from '@/core/redis/redis-pubsub.service';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { NotificationType, Prisma } from 'prisma/generated';
import { FindMyNotificationsInput } from './inputs/find-my-notifications.input';

@Injectable()
export class NotificationsService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  public async findMyNotifications(
    userId: string,
    input: FindMyNotificationsInput = {},
  ) {
    const { skip = 0, take = 20, onlyUnread = false } = input;

    return this.prismaService.notification.findMany({
      where: {
        recipientId: userId,
        ...(onlyUnread ? { isRead: false } : {}),
      },
      include: {
        actor: true,
        post: {
          include: {
            user: true,
          },
        },
        comment: {
          include: {
            user: true,
          },
        },
        message: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  public async getUnreadCount(userId: string): Promise<number> {
    return this.prismaService.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    });
  }

  public async markAsRead(notificationId: string, userId: string) {
    const notification = await this.prismaService.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return false;
    }

    if (notification.recipientId !== userId) {
      throw new ForbiddenException('Нельзя изменять чужие уведомления');
    }

    if (notification.isRead) {
      return true;
    }

    const updated = await this.prismaService.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      include: {
        actor: true,
        post: {
          include: {
            user: true,
          },
        },
        comment: {
          include: {
            user: true,
          },
        },
        message: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.publishUpdated(updated);

    return true;
  }

  public async markAllAsRead(userId: string) {
    await this.prismaService.notification.updateMany({
      where: {
        recipientId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return true;
  }

  public async createNotification(data: {
    recipientId: string;
    actorId?: string;
    type: NotificationType;
    postId?: string;
    commentId?: string;
    messageId?: string;
    chatId?: string;
  }) {
    const notification = await this.prismaService.notification.create({
      data: {
        recipientId: data.recipientId,
        actorId: data.actorId,
        type: data.type,
        postId: data.postId,
        commentId: data.commentId,
        messageId: data.messageId,
        chatId: data.chatId,
      },
      include: {
        actor: true,
        post: {
          include: {
            user: true,
          },
        },
        comment: {
          include: {
            user: true,
          },
        },
        message: {
          include: {
            user: true,
          },
        },
      },
    });

    await this.publishCreated(notification);

    return notification;
  }

  public async createMessageNotifications(data: {
    chatId: string;
    messageId: string;
    senderId: string;
    recipientIds: string[];
  }) {
    const recipients = data.recipientIds.filter((id) => id !== data.senderId);

    for (const recipientId of recipients) {
      await this.createNotification({
        recipientId,
        actorId: data.senderId,
        type: NotificationType.NEW_MESSAGE,
        messageId: data.messageId,
        chatId: data.chatId,
      });
    }
  }

  private async publishCreated(notification: Prisma.NotificationGetPayload<{
    include: {
      actor: true;
      post: { include: { user: true } };
      comment: { include: { user: true } };
      message: { include: { user: true } };
    };
  }>) {
    await this.redisPubSub.getPubSub().publish('NOTIFICATION_CREATED', {
      notificationCreatedForUser: {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
        _recipientId: notification.recipientId,
      },
    });
  }

  private async publishUpdated(notification: Prisma.NotificationGetPayload<{
    include: {
      actor: true;
      post: { include: { user: true } };
      comment: { include: { user: true } };
      message: { include: { user: true } };
    };
  }>) {
    await this.redisPubSub.getPubSub().publish('NOTIFICATION_UPDATED', {
      notificationUpdatedForUser: {
        ...notification,
        createdAt: notification.createdAt.toISOString(),
        updatedAt: notification.updatedAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
        _recipientId: notification.recipientId,
      },
    });
  }

}
