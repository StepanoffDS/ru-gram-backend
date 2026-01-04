import { UserModel } from '@/modules/auth/account/models/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Chat } from 'prisma/generated';
import { MessageModel } from './message.model';

@ObjectType()
export class ChatModel implements Chat {
  @Field(() => ID)
  id: string;

  @Field(() => [UserModel])
  users: UserModel[];

  @Field(() => [MessageModel])
  messages: MessageModel[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
