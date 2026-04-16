import { RedisPubSubService } from '@/core/redis/redis-pubsub.service';
import { Auth } from '@/shared/decorators/auth.decorator';
import { Authorized } from '@/shared/decorators/authorized.decorator';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatService } from './chat.service';
import { CreateChatInput } from './inputs/create-chat.input';
import { CreateMessageInput } from './inputs/create-message.input';
import { MessagesPaginationInput } from './inputs/messages-pagination.input';
import { UpdateMessageInput } from './inputs/update-message.input';
import { ChatReadUpdateModel } from './models/chat-read-update.model';
import { ChatModel } from './models/chat.model';
import { MessageModel } from './models/message.model';

@Resolver('Chat')
export class ChatResolver {
  public constructor(
    private readonly chatService: ChatService,
    private readonly redisPubSub: RedisPubSubService,
  ) {}

  @Auth()
  @Query(() => ChatModel, { name: 'findChatById' })
  public async findChatById(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
  ) {
    return this.chatService.findChatById(chatId, userId);
  }

  @Auth()
  @Query(() => [ChatModel], { name: 'findAllChatsByMe' })
  public async findAllChatsByMe(@Authorized('id') userId: string) {
    return this.chatService.findAllChatsByUserId(userId);
  }

  @Auth()
  @Mutation(() => ChatModel, { name: 'createOrFindChat' })
  public async createOrFindChat(
    @Authorized('id') userId: string,
    @Args('data') createChatInput: CreateChatInput,
  ) {
    return this.chatService.createOrFindChat(userId, createChatInput);
  }

  @Auth()
  @Mutation(() => MessageModel, { name: 'createMessage' })
  public async createMessage(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
    @Args('data') createMessageInput: CreateMessageInput,
  ) {
    const message = await this.chatService.createMessage(
      chatId,
      userId,
      createMessageInput,
    );

    await this.redisPubSub.getPubSub().publish('MESSAGE_CREATED', {
      messageCreated: {
        ...message,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        _allowedUserIds: message.chat.users.map((u) => u.id),
      },
    });

    return message;
  }

  @Auth()
  @Query(() => [MessageModel], { name: 'findMessagesByChatId' })
  public async findMessagesByChatId(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
    @Args('pagination', { nullable: true, defaultValue: { skip: 0, take: 50 } })
    paginationInput: MessagesPaginationInput,
  ) {
    const result = await this.chatService.findMessagesByChatId(
      chatId,
      userId,
      paginationInput,
    );
    return result.data;
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'markChatAsRead' })
  public async markChatAsRead(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
  ) {
    const marked = await this.chatService.markChatAsRead(chatId, userId);

    if (marked) {
      const chat = await this.chatService.findChatById(chatId, userId);
      const lastReadAt = new Date().toISOString();

      await this.redisPubSub.getPubSub().publish('CHAT_READ_UPDATED', {
        chatReadUpdated: {
          chatId,
          userId,
          lastReadAt,
          _allowedUserIds: chat.users.map((u) => u.id),
        },
      });
    }

    return marked;
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'setChatImportant' })
  public async setChatImportant(
    @Args('chatId') chatId: string,
    @Args('isImportant') isImportant: boolean,
    @Authorized('id') userId: string,
  ) {
    return this.chatService.setChatImportant(chatId, userId, isImportant);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'clearChatHistory' })
  public async clearChatHistory(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
  ) {
    return this.chatService.clearChatHistory(chatId, userId);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'deleteChat' })
  public async deleteChat(
    @Args('chatId') chatId: string,
    @Authorized('id') userId: string,
  ) {
    return this.chatService.deleteChat(chatId, userId);
  }

  @Auth()
  @Mutation(() => Boolean, { name: 'deleteMessage' })
  public async deleteMessage(
    @Args('messageId') messageId: string,
    @Authorized('id') userId: string,
  ) {
    const deleted = await this.chatService.deleteMessage(messageId, userId);

    if (deleted) {
      // Публикуем событие об удалении сообщения
      await this.redisPubSub.getPubSub().publish('MESSAGE_DELETED', {
        messageDeleted: messageId,
      });
    }

    return deleted;
  }

  @Auth()
  @Mutation(() => MessageModel, { name: 'updateMessage' })
  public async updateMessage(
    @Args('messageId') messageId: string,
    @Authorized('id') userId: string,
    @Args('data') updateMessageInput: UpdateMessageInput,
  ) {
    const updatedMessage = await this.chatService.updateMessage(
      messageId,
      userId,
      updateMessageInput,
    );

    await this.redisPubSub.getPubSub().publish('MESSAGE_UPDATED', {
      messageUpdated: {
        ...updatedMessage,
        createdAt: updatedMessage.createdAt.toISOString(),
        updatedAt: updatedMessage.updatedAt.toISOString(),
        _allowedUserIds: updatedMessage.chat.users.map((u) => u.id),
      },
    });

    return updatedMessage;
  }

  /**
   * Подписка на новые сообщения в конкретном чате
   */
  @Auth()
  @Subscription(() => MessageModel, {
    name: 'messageCreated',
    filter: (payload, variables) => {
      return payload.messageCreated.chatId === variables.chatId;
    },
    resolve: (payload) => {
      return {
        ...payload.messageCreated,
        createdAt: new Date(payload.messageCreated.createdAt),
        updatedAt: new Date(payload.messageCreated.updatedAt),
      };
    },
  })
  messageCreated(@Args('chatId') chatId: string) {
    void chatId;
    return this.redisPubSub.getPubSub().asyncIterator('MESSAGE_CREATED');
  }

  @Auth()
  @Subscription(() => MessageModel, {
    name: 'messageCreatedForUser',
    filter: (payload, _variables, context) => {
      const userId = context.req?.session?.userId;
      const allowed: string[] = payload.messageCreated._allowedUserIds ?? [];
      return !!userId && allowed.includes(userId);
    },
    resolve: (payload) => {
      return {
        ...payload.messageCreated,
        createdAt: new Date(payload.messageCreated.createdAt),
        updatedAt: new Date(payload.messageCreated.updatedAt),
      };
    },
  })
  messageCreatedForUser() {
    return this.redisPubSub.getPubSub().asyncIterator('MESSAGE_CREATED');
  }

  @Auth()
  @Subscription(() => MessageModel, {
    name: 'messageUpdated',
    filter: (payload, variables) => {
      return payload.messageUpdated.chatId === variables.chatId;
    },
    resolve: (payload) => {
      return {
        ...payload.messageUpdated,
        createdAt: new Date(payload.messageUpdated.createdAt),
        updatedAt: new Date(payload.messageUpdated.updatedAt),
      };
    },
  })
  messageUpdated(@Args('chatId') chatId: string) {
    void chatId;
    return this.redisPubSub.getPubSub().asyncIterator('MESSAGE_UPDATED');
  }

  @Auth()
  @Subscription(() => ChatReadUpdateModel, {
    name: 'chatReadUpdated',
    filter: (payload, variables, context) => {
      const userId = context.req?.session?.userId;
      const allowed: string[] = payload.chatReadUpdated._allowedUserIds ?? [];
      return (
        !!userId &&
        allowed.includes(userId) &&
        payload.chatReadUpdated.chatId === variables.chatId
      );
    },
    resolve: (payload) => {
      return {
        ...payload.chatReadUpdated,
        lastReadAt: new Date(payload.chatReadUpdated.lastReadAt),
      };
    },
  })
  chatReadUpdated(@Args('chatId') chatId: string) {
    void chatId;
    return this.redisPubSub.getPubSub().asyncIterator('CHAT_READ_UPDATED');
  }

  /**
   * Подписка на удаление сообщений в конкретном чате
   */
  @Auth()
  @Subscription(() => String, {
    name: 'messageDeleted',
  })
  messageDeleted() {
    return this.redisPubSub.getPubSub().asyncIterator('MESSAGE_DELETED');
  }
}
