import { IsPassword } from '@/shared/decorators/is-password.decorator';
import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';

@InputType()
export class ChangeEmailInput {
  @Field(() => String)
  @IsEmail()
  @IsNotEmpty()
  newEmail: string;

  @Field(() => String)
  @IsPassword()
  password: string;
}
