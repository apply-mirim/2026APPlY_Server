import { IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQnaDto {
  @ApiPropertyOptional({ example: '홍길동', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  authorName?: string;

  @ApiProperty({ example: '기숙사 신청은 언제 하나요?', maxLength: 400 })
  @IsString()
  @MaxLength(400)
  question!: string;
}
