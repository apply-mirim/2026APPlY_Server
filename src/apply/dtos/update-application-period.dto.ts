import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateApplicationPeriodDto {
  @ApiProperty({
    example: '2026-03-10T00:00:00+09:00',
    description: '지원 시작 시각(초 단위 포함 가능)',
  })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({
    example: '2026-03-20T23:59:59+09:00',
    description: '지원 종료 시각(초 단위 포함 가능)',
  })
  @IsDateString()
  endsAt!: string;
}
