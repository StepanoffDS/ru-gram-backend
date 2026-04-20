import { Field, InputType } from '@nestjs/graphql';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateMessageInput {
  @Field(() => String)
  @IsString()
  @MaxLength(5000)
  content: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(1)
  images?: string[];

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}
