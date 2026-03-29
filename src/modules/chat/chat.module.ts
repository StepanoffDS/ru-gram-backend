import { Module } from '@nestjs/common';
import { ChatFieldsResolver } from './chat-fields.resolver';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';
import { MessageFieldsResolver } from './message-fields.resolver';

@Module({
  providers: [ChatResolver, ChatFieldsResolver, MessageFieldsResolver, ChatService],
})
export class ChatModule {}
