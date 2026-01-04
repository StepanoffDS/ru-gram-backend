import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsNotEmpty, MinLength } from 'class-validator';

@InputType()
export class CreateChatInput {
  @Field(() => [String])
  @IsArray()
  @IsNotEmpty({ each: true })
  @MinLength(1, { each: true })
  userIds: string[];
}
