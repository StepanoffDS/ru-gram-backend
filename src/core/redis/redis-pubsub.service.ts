import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import Redis from 'ioredis';

@Injectable()
export class RedisPubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly pubSub: RedisPubSub;
  private readonly publisher: Redis;
  private readonly subscriber: Redis;

  public constructor(private readonly configService: ConfigService) {
    const redisUrl = configService.getOrThrow<string>('REDIS_URI');

    // Создаем отдельные клиенты для publisher и subscriber
    this.publisher = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.subscriber = new Redis(redisUrl, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    this.publisher.on('error', (err) => {
      this.logger.error('Redis publisher error:', err);
    });

    this.subscriber.on('error', (err) => {
      this.logger.error('Redis subscriber error:', err);
    });

    this.publisher.on('connect', () => {
      this.logger.log('Redis publisher connected');
    });

    this.subscriber.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    // Используем приведение типов для решения конфликта версий ioredis
    this.pubSub = new RedisPubSub({
      publisher: this.publisher as any,
      subscriber: this.subscriber as any,
    });
  }

  public onModuleInit(): void {
    // Подключение происходит автоматически при создании Redis клиентов
    this.logger.log('RedisPubSub service initialized');
  }

  public async onModuleDestroy(): Promise<void> {
    try {
      await this.pubSub.close();
      await this.publisher.quit();
      await this.subscriber.quit();
      this.logger.log('RedisPubSub service disconnected');
    } catch (err: unknown) {
      this.logger.error('Failed to disconnect RedisPubSub:', err);
    }
  }

  public getPubSub(): RedisPubSub {
    return this.pubSub;
  }
}
