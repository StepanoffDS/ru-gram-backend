import { Module } from '@nestjs/common';
import { ChatFieldsResolver } from './chat-fields.resolver';
import { ChatResolver } from './chat.resolver';
import { ChatService } from './chat.service';

@Module({
  providers: [ChatResolver, ChatFieldsResolver, ChatService],
})
export class ChatModule {}
