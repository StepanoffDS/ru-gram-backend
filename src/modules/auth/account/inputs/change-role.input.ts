import { Field, InputType } from '@nestjs/graphql';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Role } from 'prisma/generated';

@InputType()
export class ChangeRoleInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  id: string;

  @Field(() => String)
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
