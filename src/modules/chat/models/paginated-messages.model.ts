import { Field, Int, ObjectType } from '@nestjs/graphql';
import { MessageModel } from './message.model';

@ObjectType()
export class PaginatedMessagesModel {
  @Field(() => [MessageModel])
  data: MessageModel[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
