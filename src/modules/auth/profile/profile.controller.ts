import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import {
  Controller,
  Delete,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from 'prisma/generated/client';
import { ProfileService } from './profile.service';

@Auth()
@Controller('profile-avatar')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('avatar'))
  public async updateAvatar(
    @Authorized() user: User,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return await this.profileService.updateAvatar(user, file);
  }

  @Delete('')
  public async removeAvatar(@Authorized() user: User) {
    return await this.profileService.removeAvatar(user);
  }
}
