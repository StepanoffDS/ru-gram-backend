import { PrismaService } from '@/core/prisma/prisma.service';
import { FollowsService } from '@/modules/follows/follows.service';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { hash, verify } from 'argon2';
import { Role, type Prisma, type User } from 'prisma/generated';
import { ChangeEmailInput } from './inputs/change-email.input';
import { ChangePasswordInput } from './inputs/change-password.input';
import { ChangeRoleInput } from './inputs/change-role.input';
import { CreateUserInput } from './inputs/create-user.input';
import { FilterUsersInput } from './inputs/filter.input';
import { ToggleUserBlockInput } from './inputs/toggle-user-block.input';

@Injectable()
export class AccountService {
  public constructor(
    private readonly prismaService: PrismaService,
    private readonly followsService: FollowsService,
  ) {}

  public async findAll(filterUsersInput: FilterUsersInput = {}) {
    const { take, skip, searchTerm, role, roles, isBlocked } =
      filterUsersInput;

    const whereClause = searchTerm
      ? this.findBySearchTermFilter(searchTerm)
      : undefined;

    const users = await this.prismaService.user.findMany({
      take: take ?? 15,
      skip: skip ?? 0,
      where: {
        ...whereClause,
        ...(roles?.length ? { role: { in: roles } } : role ? { role } : {}),
        ...(typeof isBlocked === 'boolean' ? { isBlocked } : {}),
      },
      include: {
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return users;
  }

  private findBySearchTermFilter(searchTerm: string): Prisma.UserWhereInput {
    return {
      OR: [
        {
          email: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          username: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
        {
          bio: {
            contains: searchTerm,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  public async findOneById(id: string, currentUserId?: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        posts: true,
        postLikes: true,
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const followersCount = await this.followsService.getFollowersCount(user.id);
    const followingCount = await this.followsService.getFollowingCount(user.id);
    const postsCount = await this.prismaService.post.count({
      where: { userId: user.id, hidden: false },
    });
    const isFollowing =
      currentUserId && currentUserId !== user.id
        ? await this.followsService.isFollowing(currentUserId, user.id)
        : undefined;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      followersCount,
      followingCount,
      postsCount,
      ...(isFollowing !== undefined && { isFollowing }),
    };
  }

  public async findOneByUsername(username: string, id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
      include: {
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isMe = user.id === id;

    const followersCount = await this.followsService.getFollowersCount(user.id);
    const followingCount = await this.followsService.getFollowingCount(user.id);
    const postsCount = await this.prismaService.post.count({
      where: { userId: user.id, hidden: false },
    });
    const isFollowing = isMe
      ? false
      : await this.followsService.isFollowing(id, user.id);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;

    return {
      ...userWithoutPassword,
      isMe,
      followersCount,
      followingCount,
      postsCount,
      isFollowing,
    };
  }

  public async me(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      include: {
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const followersCount = await this.followsService.getFollowersCount(user.id);
    const followingCount = await this.followsService.getFollowingCount(user.id);

    return {
      ...user,
      followersCount,
      followingCount,
    };
  }

  public async findSuperAdmins() {
    return this.prismaService.user.findMany({
      where: { role: Role.SUPER_ADMIN },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
      },
    });
  }

  public async changeRole(actorId: string, changeRoleInput: ChangeRoleInput) {
    const { id, role } = changeRoleInput;

    const actor = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (actor?.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Недостаточно прав');
    }

    if (role !== Role.USER && role !== Role.ADMIN) {
      throw new BadRequestException(
        'Можно назначать только роли USER или ADMIN',
      );
    }

    const target = await this.prismaService.user.findUnique({
      where: { id },
      select: { role: true },
    });

    if (!target) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Нельзя изменить роль супер-администратора');
    }

    return this.prismaService.user.update({
      where: { id },
      data: { role },
      include: {
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async toggleUserBlock(
    actorId: string,
    toggleUserBlockInput: ToggleUserBlockInput,
  ) {
    const { id, isBlocked } = toggleUserBlockInput;

    const actor = await this.prismaService.user.findUnique({
      where: { id: actorId },
      select: { role: true },
    });

    if (!actor) {
      throw new UnauthorizedException('Пользователь не авторизован');
    }

    const target = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!target) {
      throw new NotFoundException('Пользователь не найден');
    }

    if (target.id === actorId) {
      throw new BadRequestException('Нельзя заблокировать самого себя');
    }

    if (target.role === Role.SUPER_ADMIN) {
      throw new ForbiddenException('Нельзя изменять блокировку супер-админа');
    }

    if (actor.role === Role.ADMIN && target.role !== Role.USER) {
      throw new ForbiddenException(
        'Администратор может блокировать только обычных пользователей',
      );
    }

    return this.prismaService.user.update({
      where: { id },
      data: {
        isBlocked,
        blockedAt: isBlocked ? new Date() : null,
        blockedById: isBlocked ? actorId : undefined,
      },
      include: {
        blockedBy: {
          select: {
            id: true,
            email: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  public async create(createUserInput: CreateUserInput) {
    const { email, username, password } = createUserInput;

    const isUsernameExists = await this.prismaService.user.findUnique({
      where: { username },
    });

    if (isUsernameExists) {
      throw new BadRequestException('Данный username уже занят');
    }

    const isEmailExists = await this.prismaService.user.findUnique({
      where: { email },
    });

    if (isEmailExists) {
      throw new BadRequestException('Данный email уже занят');
    }

    const user = await this.prismaService.user.create({
      data: { email, username, password: await hash(password) },
    });

    if (!user) {
      throw new InternalServerErrorException('Не удалось создать пользователя');
    }

    return true;
  }

  public async changeEmail(user: User, changeEmailInput: ChangeEmailInput) {
    const { newEmail, password } = changeEmailInput;

    const isUserExists = await this.prismaService.user.findUnique({
      where: { id: user.id },
    });

    if (!isUserExists) {
      throw new NotFoundException('Пользователь не найден');
    }

    const isValidPassword = await verify(user.password, password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный пароль');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: { email: newEmail },
    });

    if (!updatedUser) {
      throw new InternalServerErrorException('Не удалось изменить email');
    }

    return true;
  }

  public async changePassword(
    user: User,
    changePasswordInput: ChangePasswordInput,
  ) {
    const { currentPassword, newPassword, confirmNewPassword } =
      changePasswordInput;

    const isNewPassword = await verify(user.password, newPassword);

    if (isNewPassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    const isValidPassword = await verify(user.password, currentPassword);

    if (!isValidPassword) {
      throw new UnauthorizedException('Неверный пароль');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestException('Новые пароли не совпадают');
    }

    const updatedUser = await this.prismaService.user.update({
      where: { id: user.id },
      data: { password: await hash(newPassword) },
    });

    if (!updatedUser) {
      throw new InternalServerErrorException('Не удалось изменить пароль');
    }

    return true;
  }
}
