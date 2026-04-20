import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';

@Auth()
@Controller('chats')
export class ChatController {
  public constructor(private readonly chatService: ChatService) {}

  @Post(':chatId/images')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadMessageImage(
    @Param('chatId') chatId: string,
    @Authorized('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.chatService.uploadMessageImage(chatId, userId, file);
  }
}
