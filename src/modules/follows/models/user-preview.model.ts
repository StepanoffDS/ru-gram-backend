import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class UserPreviewModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  avatar: string;

  @Field(() => String, { nullable: true })
  bio: string;

  @Field(() => Date)
  followedAt: Date;
}
