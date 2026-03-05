import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { UpdateApplicationPeriodDto } from './dtos/update-application-period.dto';
import { ApplyService } from './services/apply.service';
import { ApplicationPeriodService } from './services/application-period.service';

@ApiTags('admin-apply')
@Controller('admin')
@UseGuards(AdminJwtGuard)
@ApiBearerAuth('JWT-auth')
export class AdminApplyController {
  constructor(
    private readonly applyService: ApplyService,
    private readonly periodService: ApplicationPeriodService,
  ) {}

  @Get('applicants')
  @ApiOperation({ summary: '지원자 목록 조회(어드민)' })
  @ApiResponse({ status: 200, description: '지원자 목록 반환' })
  getApplicants() {
    return this.applyService.findAll();
  }

  @Delete('applicants/:id')
  @ApiOperation({ summary: '지원자 삭제(어드민)' })
  @ApiParam({ name: 'id', description: '지원자 UUID' })
  @ApiResponse({ status: 200, description: '지원자 삭제 성공' })
  @SuccessMessage('지원자 정보가 삭제되었습니다.')
  removeApplicant(@Param('id') id: string) {
    return this.applyService.remove(id);
  }

  @Get('applicants/export')
  @ApiOperation({ summary: '지원자 엑셀 다운로드(어드민)' })
  @ApiResponse({
    status: 200,
    description: '단일 시트 xlsx 파일 반환',
  })
  async exportApplicants(@Res() response: Response) {
    const file = await this.applyService.exportExcel();

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="applicants-${Date.now()}.xlsx"`,
    );

    response.send(Buffer.from(file));
  }

  @Patch('period')
  @ApiOperation({ summary: '지원 가능 기간 설정(어드민)' })
  @ApiBody({ type: UpdateApplicationPeriodDto })
  @ApiResponse({ status: 200, description: '지원 기간 업데이트 성공' })
  @SuccessMessage('지원 기간이 업데이트되었습니다.')
  updatePeriod(@Body() dto: UpdateApplicationPeriodDto) {
    return this.periodService.updatePeriod(dto.startsAt, dto.endsAt);
  }
}
