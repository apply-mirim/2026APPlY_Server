import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { TrackAnalyticsDto } from './dtos/track-analytics.dto';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events')
  @ApiOperation({ summary: '행동 분석 이벤트 수집(전체 이용자)' })
  @ApiBody({ type: TrackAnalyticsDto })
  @ApiResponse({ status: 201, description: '이벤트 저장 성공' })
  @SuccessMessage('행동 분석 이벤트가 수집되었습니다.')
  track(@Body() dto: TrackAnalyticsDto) {
    return this.analyticsService.track(dto);
  }

  @Get('admin/summary')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '행동 분석 요약 조회(어드민)' })
  @ApiResponse({
    status: 200,
    description: '페이지 체류/클릭/스크롤 집계 반환',
  })
  getSummary() {
    return this.analyticsService.getSummary();
  }
}
