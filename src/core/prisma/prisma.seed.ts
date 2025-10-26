import { BadGatewayException, Logger } from '@nestjs/common';
import { PrismaClient, Role } from 'prisma/generated';

const prisma = new PrismaClient();

async function main() {
  try {
    Logger.log('Заполнение базы данных...');
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        username: 'admin',
        password: 'password',
        role: Role.ADMIN,
      },
    });
    Logger.log('Пользователь admin создан');
    await prisma.user.create({
      data: {
        email: 'user@example.com',
        username: 'user',
        password: 'password',
        role: Role.USER,
      },
    });
    Logger.log('Пользователь user создан');
    Logger.log('База данных заполнена');
  } catch (error) {
    Logger.error(error);
    throw new BadGatewayException('Ошибка при заполнении базы данных');
  } finally {
    Logger.log('Отключение от базы данных...');
    await prisma.$disconnect();
  }
}

void main();
