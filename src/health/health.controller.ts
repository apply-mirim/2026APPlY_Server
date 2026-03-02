import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SuccessMessage } from '../common/decorators/success-message.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @SuccessMessage('헬스체크 성공')
  @ApiOperation({
    summary: '헬스체크',
    description: '서버 상태를 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '헬스체크 성공',
    schema: {
      example: {
        statusCode: 200,
        data: {
          status: 'ok',
          timestamp: '2026-03-03T00:00:00.000Z',
        },
        message: '헬스체크 성공',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
