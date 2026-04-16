import { PrismaService } from '@/core/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateChatInput } from './inputs/create-chat.input';
import { CreateMessageInput } from './inputs/create-message.input';
import { MessagesPaginationInput } from './inputs/messages-pagination.input';
import { UpdateMessageInput } from './inputs/update-message.input';

@Injectable()
export class ChatService {
  public constructor(private readonly prismaService: PrismaService) {}

  /**
   * Создать новый чат или найти существующий между пользователями
   */
  public async createOrFindChat(
    userId: string,
    createChatInput: CreateChatInput,
  ) {
    const { userIds } = createChatInput;

    // Проверяем, что пользователь не пытается создать чат сам с собой
    if (userIds.length === 0) {
      throw new BadRequestException(
        'Необходимо указать хотя бы одного пользователя',
      );
    }

    // Добавляем текущего пользователя в список участников
    const allUserIds = [...new Set([userId, ...userIds])];

    // Проверяем, что все пользователи существуют
    const users = await this.prismaService.user.findMany({
      where: {
        id: {
          in: allUserIds,
        },
      },
    });

    if (users.length !== allUserIds.length) {
      throw new NotFoundException(
        'Один или несколько пользователей не найдены',
      );
    }

    // Ищем существующий чат между этими пользователями
    const existingChat = await this.findChatByUsers(allUserIds);

    if (existingChat) {
      return this.prismaService.chat.findUnique({
        where: { id: existingChat.id },
        include: {
          users: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });
    }

    // Создаем новый чат
    return this.prismaService.chat.create({
      data: {
        users: {
          connect: allUserIds.map((id) => ({ id })),
        },
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Найти чат по ID с проверкой доступа
   */
  public async findChatById(chatId: string, userId: string) {
    const chat = await this.prismaService.chat.findUnique({
      where: { id: chatId },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    // Проверяем, что пользователь является участником чата
    const isParticipant = chat.users.some((user) => user.id === userId);
    if (!isParticipant) {
      throw new ForbiddenException('У вас нет доступа к этому чату');
    }

    return chat;
  }

  /**
   * Получить все чаты пользователя
   */
  public async findAllChatsByUserId(userId: string) {
    return this.prismaService.chat.findMany({
      where: {
        users: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  /**
   * Создать сообщение в чате
   */
  public async createMessage(
    chatId: string,
    userId: string,
    createMessageInput: CreateMessageInput,
  ) {
    // Проверяем доступ к чату
    await this.findChatById(chatId, userId);

    const { content, images = [], replyToMessageId } = createMessageInput;

    if (!content.trim() && images.length === 0) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    if (replyToMessageId) {
      const replyToMessage = await this.prismaService.message.findFirst({
        where: {
          id: replyToMessageId,
          chatId,
        },
        select: { id: true },
      });

      if (!replyToMessage) {
        throw new BadRequestException('Сообщение для ответа не найдено');
      }
    }

    const message = await this.prismaService.message.create({
      data: {
        content: content.trim(),
        images,
        replyTo: replyToMessageId
          ? {
              connect: { id: replyToMessageId },
            }
          : undefined,
        chat: {
          connect: { id: chatId },
        },
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        chat: {
          include: {
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // Обновляем updatedAt чата
    await this.prismaService.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  /**
   * Получить сообщения чата с пагинацией
   */
  public async findMessagesByChatId(
    chatId: string,
    userId: string,
    paginationInput: MessagesPaginationInput = { skip: 0, take: 50 },
  ) {
    // Проверяем доступ к чату
    await this.findChatById(chatId, userId);

    const { skip = 0, take = 50 } = paginationInput;

    const [messages, total] = await Promise.all([
      this.prismaService.message.findMany({
        where: { chatId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              avatar: true,
            },
          },
          replyTo: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.message.count({
        where: { chatId },
      }),
    ]);

    // Возвращаем в хронологическом порядке (старые первыми)
    return {
      data: messages.reverse(),
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  /**
   * Удалить сообщение
   */
  public async deleteMessage(messageId: string, userId: string) {
    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    // Удалять сообщение может только его автор
    const isAuthor = message.userId === userId;

    if (!isAuthor) {
      throw new ForbiddenException(
        'У вас нет прав на удаление этого сообщения',
      );
    }

    await this.prismaService.message.delete({
      where: { id: messageId },
    });

    return true;
  }

  /**
   * Обновить сообщение
   */
  public async updateMessage(
    messageId: string,
    userId: string,
    updateMessageInput: UpdateMessageInput,
  ) {
    const message = await this.prismaService.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Сообщение не найдено');
    }

    if (message.userId !== userId) {
      throw new ForbiddenException(
        'У вас нет прав на редактирование этого сообщения',
      );
    }

    const content = updateMessageInput.content.trim();

    if (!content) {
      throw new BadRequestException('Сообщение не может быть пустым');
    }

    return this.prismaService.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
        replyTo: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        chat: {
          include: {
            users: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Найти чат по списку пользователей
   */
  /**
   * Количество непрочитанных сообщений для пользователя в чате
   * (сообщения не от текущего пользователя, созданные после lastReadAt).
   */
  public async getUnreadMessageCount(
    userId: string,
    chatId: string,
  ): Promise<number> {
    const readState = await this.prismaService.chatReadState.findUnique({
      where: {
        userId_chatId: { userId, chatId },
      },
    });

    const lastReadAt = readState?.lastReadAt ?? new Date(0);

    return this.prismaService.message.count({
      where: {
        chatId,
        createdAt: { gt: lastReadAt },
        NOT: { userId },
      },
    });
  }

  /**
   * Отметить чат прочитанным для текущего пользователя.
   */
  public async markChatAsRead(
    chatId: string,
    userId: string,
  ): Promise<boolean> {
    await this.findChatById(chatId, userId);

    await this.prismaService.chatReadState.upsert({
      where: {
        userId_chatId: { userId, chatId },
      },
      create: {
        userId,
        chatId,
        lastReadAt: new Date(),
      },
      update: {
        lastReadAt: new Date(),
      },
    });

    return true;
  }

  /**
   * Пометить чат как важный/неважный для текущего пользователя.
   */
  public async setChatImportant(
    chatId: string,
    userId: string,
    isImportant: boolean,
  ): Promise<boolean> {
    await this.findChatById(chatId, userId);

    const existingState = await this.prismaService.chatReadState.findUnique({
      where: {
        userId_chatId: { userId, chatId },
      },
    });

    if (!existingState && !isImportant) {
      return true;
    }

    await this.prismaService.chatReadState.upsert({
      where: {
        userId_chatId: { userId, chatId },
      },
      create: {
        userId,
        chatId,
        lastReadAt: new Date(0),
        isImportant,
      },
      update: {
        isImportant,
      },
    });

    return true;
  }

  /**
   * Получить флаг важности чата для текущего пользователя.
   */
  public async getChatImportance(
    userId: string,
    chatId: string,
  ): Promise<boolean> {
    const readState = await this.prismaService.chatReadState.findUnique({
      where: {
        userId_chatId: { userId, chatId },
      },
      select: {
        isImportant: true,
      },
    });

    return readState?.isImportant ?? false;
  }

  /**
   * Очистить историю сообщений чата для всех участников.
   */
  public async clearChatHistory(
    chatId: string,
    userId: string,
  ): Promise<boolean> {
    await this.findChatById(chatId, userId);

    await this.prismaService.message.deleteMany({
      where: { chatId },
    });

    await this.prismaService.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return true;
  }

  /**
   * Удалить чат для всех участников.
   */
  public async deleteChat(chatId: string, userId: string): Promise<boolean> {
    await this.findChatById(chatId, userId);

    await this.prismaService.chat.delete({
      where: { id: chatId },
    });

    return true;
  }

  /**
   * Прочитано ли сообщение хотя бы одним другим участником чата.
   */
  public async isMessageReadByOtherUser(
    chatId: string,
    messageAuthorId: string,
    messageCreatedAt: Date,
  ): Promise<boolean> {
    const readByOtherUsersCount = await this.prismaService.chatReadState.count({
      where: {
        chatId,
        NOT: {
          userId: messageAuthorId,
        },
        lastReadAt: {
          gte: messageCreatedAt,
        },
      },
    });

    return readByOtherUsersCount > 0;
  }

  private async findChatByUsers(userIds: string[]) {
    // Находим все чаты, где участвуют все указанные пользователи
    const chats = await this.prismaService.chat.findMany({
      where: {
        users: {
          every: {
            id: {
              in: userIds,
            },
          },
        },
      },
      include: {
        users: {
          select: {
            id: true,
          },
        },
      },
    });

    // Проверяем, что количество участников совпадает
    return chats.find((chat) => chat.users.length === userIds.length);
  }
}
