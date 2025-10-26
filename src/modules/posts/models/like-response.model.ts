import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LikeResponseModel {
  @Field(() => Boolean)
  isLiked: boolean;

  @Field(() => Int)
  likesCount: number;
}
