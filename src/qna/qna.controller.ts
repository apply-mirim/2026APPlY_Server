import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { SuccessMessage } from '../common/decorators/success-message.decorator';
import { AdminJwtGuard } from '../auth/guards/admin-jwt.guard';
import { CurrentAdmin } from '../auth/decorators/current-admin.decorator';
import { CreateQnaDto } from './dtos/create-qna.dto';
import { AnswerQnaDto } from './dtos/answer-qna.dto';
import { QnaService } from './qna.service';

@ApiTags('qna')
@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Post()
  @ApiOperation({ summary: '질문 등록(전체 이용자)' })
  @ApiBody({ type: CreateQnaDto })
  @ApiResponse({ status: 201, description: '질문 등록 성공' })
  @SuccessMessage('질문이 등록되었습니다.')
  create(@Body() dto: CreateQnaDto) {
    return this.qnaService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'QnA 목록 조회(전체 이용자)' })
  @ApiResponse({ status: 200, description: '질문/답변 목록 반환' })
  list() {
    return this.qnaService.list();
  }

  @Patch(':id/answer')
  @UseGuards(AdminJwtGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'QnA 답변 등록(어드민)' })
  @ApiParam({ name: 'id', description: '질문 UUID' })
  @ApiBody({ type: AnswerQnaDto })
  @ApiResponse({ status: 200, description: '답변 등록 성공' })
  @SuccessMessage('답변이 등록되었습니다.')
  answer(
    @Param('id') id: string,
    @Body() dto: AnswerQnaDto,
    @CurrentAdmin() admin: { username: string },
  ) {
    return this.qnaService.answer(id, dto.answer, admin.username);
  }
}
