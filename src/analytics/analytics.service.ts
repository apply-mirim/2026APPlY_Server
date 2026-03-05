import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrackAnalyticsDto } from './dtos/track-analytics.dto';
import {
  AnalyticsEventEntity,
  AnalyticsEventType,
} from './entities/analytics-event.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly analyticsRepository: Repository<AnalyticsEventEntity>,
  ) {}

  async track(dto: TrackAnalyticsDto) {
    const event = this.analyticsRepository.create({
      sessionId: dto.sessionId,
      eventType: dto.eventType,
      pagePath: dto.pagePath,
      durationMs: dto.durationMs ?? null,
      payload: dto.payload ?? null,
    });

    const saved = await this.analyticsRepository.save(event);
    return {
      id: saved.id,
    };
  }

  async getSummary() {
    const latestEvents = await this.analyticsRepository.find({
      order: { createdAt: 'DESC' },
      take: 3000,
    });

    const pageDuration = new Map<string, { total: number; count: number }>();
    const clickByPage = new Map<string, number>();
    const scrollByPage = new Map<string, number>();
    const elementClicks = new Map<string, number>();

    latestEvents.forEach((event) => {
      if (
        event.eventType === AnalyticsEventType.PageView &&
        event.durationMs !== null
      ) {
        const current = pageDuration.get(event.pagePath) ?? {
          total: 0,
          count: 0,
        };
        current.total += event.durationMs;
        current.count += 1;
        pageDuration.set(event.pagePath, current);
      }

      if (event.eventType === AnalyticsEventType.Click) {
        clickByPage.set(
          event.pagePath,
          (clickByPage.get(event.pagePath) ?? 0) + 1,
        );

        const element =
          typeof event.payload?.element === 'string'
            ? event.payload.element
            : 'unknown';
        elementClicks.set(element, (elementClicks.get(element) ?? 0) + 1);
      }

      if (event.eventType === AnalyticsEventType.Scroll) {
        scrollByPage.set(
          event.pagePath,
          (scrollByPage.get(event.pagePath) ?? 0) + 1,
        );
      }
    });

    const averageStayByPage = Array.from(pageDuration.entries()).map(
      ([pagePath, value]) => ({
        pagePath,
        averageDurationMs: Math.round(value.total / Math.max(value.count, 1)),
      }),
    );

    const clicksByPage = Array.from(clickByPage.entries()).map(
      ([pagePath, count]) => ({
        pagePath,
        count,
      }),
    );

    const scrollEventsByPage = Array.from(scrollByPage.entries()).map(
      ([pagePath, count]) => ({
        pagePath,
        count,
      }),
    );

    const topClickedElements = Array.from(elementClicks.entries())
      .map(([element, count]) => ({ element, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      averageStayByPage,
      clicksByPage,
      scrollEventsByPage,
      topClickedElements,
      sampledEvents: latestEvents.length,
    };
  }
}
