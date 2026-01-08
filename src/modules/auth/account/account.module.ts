import { FollowsModule } from '@/modules/follows/follows.module';
import { Module } from '@nestjs/common';
import { AccountResolver } from './account.resolver';
import { AccountService } from './account.service';

@Module({
  imports: [FollowsModule],
  providers: [AccountResolver, AccountService],
})
export class AccountModule {}
