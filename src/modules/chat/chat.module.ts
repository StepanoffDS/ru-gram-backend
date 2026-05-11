import { NotificationsModule } from '@/modules/notifications/notifications.module';
import { Module } from '@nestjs/common';
import { ChatFieldsResolver } from './chat-fields.resolver';
import { ChatController } from './chat.controller';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { MessageFieldsResolver } from './message-fields.resolver';

@Module({
  imports: [NotificationsModule],
  controllers: [ChatController],
  providers: [
    ChatResolver,
    ChatFieldsResolver,
    MessageFieldsResolver,
    ChatService,
  ],
})
export class ChatModule {}
