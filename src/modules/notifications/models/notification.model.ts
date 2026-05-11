import { ChatModel } from '@/modules/chat/models/chat.model';
import { MessageModel } from '@/modules/chat/models/message.model';
import { UserModel } from '@/modules/auth/account/models/user.model';
import { PostCommentModel } from '@/modules/posts/models/post-comment.model';
import { PostModel } from '@/modules/posts/models/post.model';
import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Notification, NotificationType } from 'prisma/generated';

registerEnumType(NotificationType, {
  name: 'NotificationType',
});

@ObjectType()
export class NotificationModel implements Notification {
  @Field(() => ID)
  id: string;

  @Field(() => NotificationType)
  type: NotificationType;

  @Field(() => Boolean)
  isRead: boolean;

  @Field(() => Date, { nullable: true })
  readAt: Date | null;

  @Field(() => ID)
  recipientId: string;

  @Field(() => ID, { nullable: true })
  actorId: string | null;

  @Field(() => ID, { nullable: true })
  postId: string | null;

  @Field(() => ID, { nullable: true })
  commentId: string | null;

  @Field(() => ID, { nullable: true })
  messageId: string | null;

  @Field(() => ID, { nullable: true })
  chatId: string | null;

  @Field(() => UserModel, { nullable: true })
  actor?: UserModel | null;

  @Field(() => PostModel, { nullable: true })
  post?: PostModel | null;

  @Field(() => PostCommentModel, { nullable: true })
  comment?: PostCommentModel | null;

  @Field(() => MessageModel, { nullable: true })
  message?: MessageModel | null;

  @Field(() => ChatModel, { nullable: true })
  chat?: ChatModel | null;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
