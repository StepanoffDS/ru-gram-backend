import { UserModel } from '@/modules/auth/account/models/user.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { PostComment } from 'prisma/generated';

@ObjectType()
export class PostCommentModel implements PostComment {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  postId: string;

  @Field(() => String)
  userId: string;

  @Field(() => String, { nullable: true })
  parentId: string | null;

  @Field(() => UserModel)
  user: UserModel;

  @Field(() => [PostCommentModel])
  replies: PostCommentModel[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
