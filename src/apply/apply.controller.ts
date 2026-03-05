import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { SubmitApplicationDto } from './dtos/submit-application.dto';
import { ApplyService } from './services/apply.service';
import { ApplicationPeriodService } from './services/application-period.service';

@ApiTags('apply')
@Controller('apply')
export class ApplyController {
  constructor(
    private readonly applyService: ApplyService,
    private readonly periodService: ApplicationPeriodService,
  ) {}

  @Post('queue/enter')
  @ApiOperation({ summary: '지원 대기열 진입' })
  @ApiResponse({ status: 201, description: '대기열 티켓 발급' })
  @SuccessMessage('대기열에 진입했습니다.')
  enterQueue() {
    return this.applyService.enterQueue();
  }

  @Get('queue/status/:ticketId')
  @ApiOperation({ summary: '대기열 순번 조회' })
  @ApiParam({
    name: 'ticketId',
    description: 'queue/enter 에서 발급된 ticketId',
  })
  @ApiResponse({ status: 200, description: '대기열 상태 반환' })
  getQueueStatus(@Param('ticketId') ticketId: string) {
    return this.applyService.getQueueStatus(ticketId);
  }

  @Post('submit')
  @ApiOperation({ summary: '지원서 제출' })
  @ApiBody({ type: SubmitApplicationDto })
  @ApiResponse({ status: 201, description: '지원서 제출 성공' })
  @SuccessMessage('지원서가 제출되었습니다.')
  submit(@Body() dto: SubmitApplicationDto) {
    return this.applyService.submit(dto);
  }

  @Get('period/status')
  @ApiOperation({ summary: '지원 가능 기간 상태 조회' })
  @ApiResponse({
    status: 200,
    description: '지원 기간 시작/종료 및 현재 오픈 여부',
  })
  getPeriodStatus() {
    return this.periodService.getPeriodStatus();
  }
}
