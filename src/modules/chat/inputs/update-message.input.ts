import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

@InputType()
export class UpdateMessageInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;
}
