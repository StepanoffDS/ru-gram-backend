import { Auth } from '@/shared/decorators/auth.decorator';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { MessageModel } from './models/message.model';

@Auth()
@Resolver(() => MessageModel)
export class MessageFieldsResolver {
  public constructor(private readonly chatService: ChatService) {}

  @ResolveField('isReadByOtherUser', () => Boolean)
  public async isReadByOtherUser(
    @Parent() message: MessageModel,
  ): Promise<boolean> {
    return this.chatService.isMessageReadByOtherUser(
      message.chatId,
      message.userId,
      message.createdAt,
    );
  }
}
