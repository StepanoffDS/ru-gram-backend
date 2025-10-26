import type { GqlContext } from '@/shared/types/gql-context.types';
import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { UserModel } from '../account/models/user.model';
import { LoginInput } from './inputs/login.input';
import { SessionService } from './session.service';

@Resolver('Session')
export class SessionResolver {
  constructor(private readonly sessionService: SessionService) {}

  @Mutation(() => UserModel, { name: 'loginUser' })
  public async login(
    @Context() { req }: GqlContext,
    @Args('data') loginInput: LoginInput,
  ) {
    return await this.sessionService.login(req, loginInput);
  }

  @Mutation(() => String, { name: 'logoutUser' })
  public async logout(@Context() { req }: GqlContext) {
    return await this.sessionService.logout(req);
  }
}
