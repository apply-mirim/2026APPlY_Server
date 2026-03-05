import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { randomUUID } from 'crypto';

@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queueKey = 'apply:queue:tickets';
  private readonly memoryQueue: string[] = [];
  private redis: Redis | null = null;

  constructor(private readonly configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL');

    try {
      if (redisUrl) {
        this.redis = new Redis(redisUrl);
      } else {
        const host = this.configService.get<string>('REDIS_HOST', '127.0.0.1');
        const port = Number(
          this.configService.get<string>('REDIS_PORT', '6379'),
        );
        this.redis = new Redis({ host, port });
      }

      this.redis.on('error', (error) => {
        this.logger.warn(`Redis queue fallback to memory: ${error.message}`);
        this.redis = null;
      });
    } catch {
      this.logger.warn('Redis 초기화 실패, 메모리 큐로 동작합니다.');
      this.redis = null;
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private getEstimatedWaitSeconds(position: number) {
    if (position <= 1) {
      return 0;
    }
    return (position - 1) * 5;
  }

  async enterQueue() {
    const ticketId = randomUUID();

    if (this.redis) {
      const position = await this.redis.rpush(this.queueKey, ticketId);
      return {
        ticketId,
        position,
        estimatedWaitSeconds: this.getEstimatedWaitSeconds(position),
      };
    }

    this.memoryQueue.push(ticketId);
    const position = this.memoryQueue.length;

    return {
      ticketId,
      position,
      estimatedWaitSeconds: this.getEstimatedWaitSeconds(position),
    };
  }

  async getPosition(ticketId: string) {
    if (this.redis) {
      const tickets = await this.redis.lrange(this.queueKey, 0, -1);
      const index = tickets.indexOf(ticketId);
      return index >= 0 ? index + 1 : -1;
    }

    const index = this.memoryQueue.indexOf(ticketId);
    return index >= 0 ? index + 1 : -1;
  }

  async getStatus(ticketId: string) {
    const position = await this.getPosition(ticketId);

    return {
      ticketId,
      position,
      estimatedWaitSeconds: this.getEstimatedWaitSeconds(position),
      canEnter: position === 1,
    };
  }

  async isFront(ticketId: string) {
    if (this.redis) {
      const first = await this.redis.lindex(this.queueKey, 0);
      return first === ticketId;
    }

    return this.memoryQueue[0] === ticketId;
  }

  async popFront(ticketId: string) {
    if (this.redis) {
      const first = await this.redis.lindex(this.queueKey, 0);
      if (first !== ticketId) {
        return false;
      }

      await this.redis.lpop(this.queueKey);
      return true;
    }

    if (this.memoryQueue[0] !== ticketId) {
      return false;
    }

    this.memoryQueue.shift();
    return true;
  }
}
