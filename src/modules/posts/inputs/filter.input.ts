import { Field, InputType, Int } from '@nestjs/graphql';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export enum PostSortOrder {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  MOST_LIKED = 'most_liked',
  LEAST_LIKED = 'least_liked',
}

@InputType()
export class FilterPostsInput {
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
  @IsEnum(PostSortOrder)
  @IsOptional()
  sortBy?: PostSortOrder;
}
