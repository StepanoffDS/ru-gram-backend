import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { ChatModel } from './models/chat.model';

@Auth()
@Resolver(() => ChatModel)
export class ChatFieldsResolver {
  public constructor(private readonly chatService: ChatService) {}

  @ResolveField('unreadCount', () => Number)
  public async unreadCount(
    @Parent() chat: ChatModel,
    @Authorized('id') userId: string,
  ): Promise<number> {
    return this.chatService.getUnreadMessageCount(userId, chat.id);
  }
}
