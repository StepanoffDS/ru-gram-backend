import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AdminContactModel {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  avatar?: string | null;
}
