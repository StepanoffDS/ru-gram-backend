import { Field, ID, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class LikedUserModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  avatar: string;

  @Field(() => Date)
  likedAt: Date;
}

@ObjectType()
export class PaginatedLikedUsersModel {
  @Field(() => [LikedUserModel])
  data: LikedUserModel[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
