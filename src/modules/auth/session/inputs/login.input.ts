import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  login: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
