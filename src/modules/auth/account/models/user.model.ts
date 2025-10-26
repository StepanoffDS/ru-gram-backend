import { PostLikesModel } from '@/modules/posts/models/post-likes.model';
import { PostModel } from '@/modules/posts/models/post.model';
import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role, User } from 'prisma/generated';

@ObjectType()
export class UserModel implements User {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String)
  password: string;

  @Field(() => String, { nullable: true })
  avatar: string;

  @Field(() => String, { nullable: true })
  bio: string;

  @Field(() => String)
  role: Role;

  @Field(() => [PostModel])
  posts: PostModel[];

  @Field(() => [PostLikesModel])
  postLikes: PostLikesModel[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
