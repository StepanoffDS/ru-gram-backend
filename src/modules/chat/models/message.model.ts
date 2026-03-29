import { UserModel } from '@/modules/auth/account/models/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Message } from 'prisma/generated';

@ObjectType()
export class MessageModel implements Message {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  content: string;

  @Field(() => [String])
  images: string[];

  @Field(() => ID)
  chatId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => Boolean, {
    description: 'Прочитано ли сообщение хотя бы одним другим участником чата',
  })
  isReadByOtherUser: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
