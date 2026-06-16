import { Field, InputType, Int } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { Role } from 'prisma/generated';

@InputType()
export class FilterUsersInput {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  take?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @IsOptional()
  skip?: number;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  searchTerm?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsEnum(Role, { each: true })
  roles?: Role[];

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}
