import { PrismaService } from '@/core/prisma/prisma.service';
import { StorageService } from '@/modules/libs/storage/storage.service';
import { PostImageUtil } from '@/shared/utils/post-image.util';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Upload from 'graphql-upload/Upload.js';
import { User } from 'prisma/generated';
import * as sharp from 'sharp';
import { ChangeProfileInfoInput } from './inputs/change-profile-info.input';

@Injectable()
export class ProfileService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  public async updateAvatar(user: User, file: Express.Multer.File) {
    if (user.avatar) {
      await this.storageService.deleteFile(user.avatar);
    }

    PostImageUtil.validateImage(file.mimetype, file.size, 0);

    const buffer = file.buffer;
    const isGif = PostImageUtil.isGif(file.mimetype);
    const processedBuffer = await PostImageUtil.processImage(buffer, isGif);

    const filename = `/users/${user.id}.webp`;

    await this.storageService.uploadFile(
      processedBuffer,
      filename,
      'image/webp',
    );

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { avatar: filename },
    });

    return true;
  }

  public async removeAvatar(user: User) {
    if (!user.avatar) {
      return false;
    }

    await this.storageService.deleteFile(user.avatar);

    await this.prismaService.user.update({
      where: { id: user.id },
      data: { avatar: null },
    });

    return true;
  }

  public async changeInfo(
    user: User,
    changeProfileInfoInput: ChangeProfileInfoInput,
  ) {
    const { username, name, bio } = changeProfileInfoInput;

    const usernameExists = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (usernameExists && user.username !== username) {
      throw new BadRequestException('Данный никнейм уже занят');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: { username, name, bio },
    });

    if (!updatedUser) {
      throw new InternalServerErrorException(
        'Не удалось изменить информацию о профиле',
      );
    }

    return true;
  }
}
