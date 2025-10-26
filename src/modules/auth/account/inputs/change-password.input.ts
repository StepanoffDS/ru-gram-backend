import { IsPassword } from '@/shared/decorators/is-password.decorator';
import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class ChangePasswordInput {
  @Field(() => String)
  @IsPassword()
  currentPassword: string;

  @Field(() => String)
  @IsPassword()
  newPassword: string;

  @Field(() => String)
  @IsPassword()
  confirmNewPassword: string;
}
