import {
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AnalyticsEventType } from '../entities/analytics-event.entity';

export class TrackAnalyticsDto {
  @ApiProperty({ example: 'session-8f2f7d5f' })
  @IsString()
  @MaxLength(120)
  sessionId!: string;

  @ApiProperty({ enum: AnalyticsEventType, example: AnalyticsEventType.Click })
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @ApiProperty({ example: '/apply' })
  @IsString()
  @MaxLength(255)
  pagePath!: string;

  @ApiPropertyOptional({
    example: 14250,
    description: 'page_view 체류 시간(ms)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  durationMs?: number;

  @ApiPropertyOptional({
    example: { element: 'button#submit', x: 420, y: 700, scrollDepth: 0.65 },
    description: '클릭/스크롤/세션 메타데이터',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
