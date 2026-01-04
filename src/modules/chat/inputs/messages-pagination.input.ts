import { Field, InputType, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, Min } from 'class-validator';

@InputType()
export class MessagesPaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  skip?: number;

  @Field(() => Int, { nullable: true, defaultValue: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  take?: number;
}
