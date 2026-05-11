import { RedisPubSubService } from '@/core/redis/redis-pubsub.service';
import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { FindMyNotificationsInput } from './inputs/find-my-notifications.input';
import { NotificationModel } from './models/notification.model';
import { NotificationsUnreadCountModel } from './models/notifications-unread-count.model';
import { NotificationsService } from './notifications.service';

@Resolver('Notification')
export class NotificationsResolver {
  public constructor(
    private readonly notificationsService: NotificationsService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  @Auth()
  @Query(() => [NotificationModel], { name: 'findMyNotifications' })
  public async findMyNotifications(
    @Authorized('id') userId: string,
    @Args('filter', {
      nullable: true,
      defaultValue: { skip: 0, take: 20, onlyUnread: false },
    })
    input?: FindMyNotificationsInput,
  ) {
    return this.notificationsService.findMyNotifications(userId, input ?? {});
  }

  @Auth()
  @Query(() => NotificationsUnreadCountModel, {
    name: 'notificationsUnreadCount',
  })
  public async notificationsUnreadCount(@Authorized('id') userId: string) {
    const total = await this.notificationsService.getUnreadCount(userId);
    return { total };
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'markNotificationAsRead' })
  public async markNotificationAsRead(
    @Args('notificationId') notificationId: string,
    @Authorized('id') userId: string,
  ) {
    return this.notificationsService.markAsRead(notificationId, userId);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'markAllNotificationsAsRead' })
  public async markAllNotificationsAsRead(@Authorized('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Auth()
  @Subscription(() => NotificationModel, {
    name: 'notificationCreatedForUser',
    filter: (payload, _variables, context) => {
      const userId = context.req?.session?.userId;
      const recipientId = payload.notificationCreatedForUser?.recipientId;
      return !!userId && recipientId === userId;
    },
    resolve: (payload) => {
      const notification = payload.notificationCreatedForUser!;
      return {
        ...notification,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
        readAt: notification.readAt ? new Date(notification.readAt) : null,
      };
    },
  })
  public notificationCreatedForUser() {
    return this.redisPubSub.getPubSub().asyncIterator('NOTIFICATION_CREATED');
  }

  @Auth()
  @Subscription(() => NotificationModel, {
    name: 'notificationUpdatedForUser',
    filter: (payload, _variables, context) => {
      const userId = context.req?.session?.userId;
      const recipientId = payload.notificationUpdatedForUser?.recipientId;
      return !!userId && recipientId === userId;
    },
    resolve: (payload) => {
      const notification = payload.notificationUpdatedForUser!;
      return {
        ...notification,
        createdAt: new Date(notification.createdAt),
        updatedAt: new Date(notification.updatedAt),
        readAt: notification.readAt ? new Date(notification.readAt) : null,
      };
    },
  })
  public notificationUpdatedForUser() {
    return this.redisPubSub.getPubSub().asyncIterator('NOTIFICATION_UPDATED');
  }
}
