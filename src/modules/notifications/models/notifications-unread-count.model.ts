import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class NotificationsUnreadCountModel {
  @Field(() => Int)
  total: number;
}
