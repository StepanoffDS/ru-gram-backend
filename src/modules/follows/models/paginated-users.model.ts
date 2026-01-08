import { Field, Int, ObjectType } from '@nestjs/graphql';
import { UserPreviewModel } from './user-preview.model';

@ObjectType()
export class PaginatedUsersModel {
  @Field(() => [UserPreviewModel])
  data: UserPreviewModel[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
