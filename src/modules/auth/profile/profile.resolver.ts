import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { User } from 'prisma/generated';
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input';
import { ProfileService } from './profile.service';

@Auth()
@Resolver('Profile')
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) {}

  @Mutation(() => Boolean, { name: 'changeProfileInfo' })
  public async changeProfileInfo(
    @Authorized() user: User,
    @Args('data') changeProfileInfoInput: ChangeProfileInfoInput,
  ) {
    return await this.profileService.changeInfo(user, changeProfileInfoInput);
  }
}
