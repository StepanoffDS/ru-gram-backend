import { IsUsername } from '@/shared/decorators/is-username.decorator';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MaxLength } from 'class-validator';

@InputType()
export class ChangeProfileInfoInput {
  @Field(() => String)
  @IsUsername()
  @IsOptional()
  username: string;

  @Field(() => String)
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @Field(() => String)
  @IsString()
  @IsOptional()
  @MaxLength(300)
  bio?: string;
}
