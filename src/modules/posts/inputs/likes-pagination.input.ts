import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class LikesPaginationInput {
  @Field(() => Int, { defaultValue: 0 })
  skip: number = 0;

  @Field(() => Int, { defaultValue: 20 })
  take: number = 20;
}
