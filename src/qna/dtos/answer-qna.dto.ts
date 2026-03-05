import { IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AnswerQnaDto {
  @ApiProperty({ example: '면접일 공지는 추후 안내됩니다.', maxLength: 800 })
  @IsString()
  @MaxLength(800)
  answer!: string;
}
