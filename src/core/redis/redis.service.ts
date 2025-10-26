import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: RedisClientType;

  public constructor(private readonly configService: ConfigService) {
    this.client = createClient({
      url: configService.getOrThrow<string>('REDIS_URI'),
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis client connected');
    });
  }

  public async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (err: unknown) {
      this.logger.error('Failed to connect to Redis:', err);
      throw err;
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
    } catch (err: unknown) {
      this.logger.error('Failed to disconnect from Redis:', err);
      throw err;
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public isConnected(): boolean {
    return this.client.isReady;
  }
}
