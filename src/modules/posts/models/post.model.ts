import { UserModel } from '@/modules/auth/account/models/user.model';
import { Field, ID, Int, ObjectType } from '@nestjs/graphql';
import { Post } from 'prisma/generated';
import { PostLikesModel } from './post-likes.model';

@ObjectType()
export class PostModel implements Post {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String, { nullable: true })
  text: string;

  @Field(() => [String], { nullable: true })
  images: string[];

  @Field(() => Boolean)
  hidden: boolean;

  @Field(() => Int)
  likes: number;

  @Field(() => Boolean, { nullable: true })
  isLiked?: boolean;

  @Field(() => String)
  userId: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => [PostLikesModel])
  postLikes: PostLikesModel[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
