import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AddImageResponseModel {
  @Field(() => String)
  imageUrl: string;

  @Field(() => [String])
  allImages: string[];
}

@ObjectType()
export class RemoveImageResponseModel {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [String])
  remainingImages: string[];
}

@ObjectType()
export class UpdateImagesResponseModel {
  @Field(() => Boolean)
  success: boolean;

  @Field(() => [String])
  images: string[];
}
