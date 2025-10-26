import { IsPassword } from '@/shared/decorators/is-password.decorator';
import { IsUsername } from '@/shared/decorators/is-username.decorator';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @Field(() => String)
  @IsUsername()
  username: string;

  @Field(() => String)
  @IsPassword()
  password: string;
}
