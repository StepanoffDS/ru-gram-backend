import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileResolver } from './profile.resolver';
import { ProfileService } from './profile.service';

@Module({
  controllers: [ProfileController],
  providers: [ProfileResolver, ProfileService],
})
export class ProfileModule {}
