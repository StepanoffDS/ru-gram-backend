import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

@InputType()
export class UpdatePostInput {
  @Field(() => String)
  @IsString()
  @IsOptional()
  title?: string;

  @Field(() => String)
  @IsString()
  @IsOptional()
  text?: string;
}
