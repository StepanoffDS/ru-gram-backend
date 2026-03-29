import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ChatReadUpdateModel {
  @Field(() => ID)
  chatId: string;

  @Field(() => ID)
  userId: string;

  @Field(() => Date)
  lastReadAt: Date;
}
