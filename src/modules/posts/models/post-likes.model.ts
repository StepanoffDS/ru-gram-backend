import { UserModel } from '@/modules/auth/account/models/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PostLike } from 'prisma/generated';
import { PostModel } from './post.model';

@ObjectType()
export class PostLikesModel implements PostLike {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  userId: string;

  @Field(() => String)
  postId: string;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => PostModel)
  post: PostModel;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
