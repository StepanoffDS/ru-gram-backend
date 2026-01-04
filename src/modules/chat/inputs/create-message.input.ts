import { Field, InputType } from '@nestjs/graphql';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateMessageInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  content: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  images?: string[];
}
