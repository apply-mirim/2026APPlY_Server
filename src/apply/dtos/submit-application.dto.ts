import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DepartmentType,
  GenderType,
  ResidenceType,
} from '../entities/application.entity';

export class SubmitApplicationDto {
  @ApiProperty({ example: '홍길동', maxLength: 50 })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ example: '20260001', maxLength: 30 })
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  studentId!: string;

  @ApiProperty({ example: '01012345678', description: '숫자만 입력' })
  @IsString()
  @Matches(/^[0-9]{9,20}$/)
  phoneNumber!: string;

  @ApiProperty({ example: '080330', description: 'YYMMDD 6자리' })
  @IsString()
  @Length(6, 6)
  @Matches(/^[0-9]{6}$/)
  birthDate!: string;

  @ApiProperty({ enum: GenderType, example: GenderType.Female })
  @IsEnum(GenderType)
  gender!: GenderType;

  @ApiProperty({ enum: ResidenceType, example: ResidenceType.Dormitory })
  @IsEnum(ResidenceType)
  residenceType!: ResidenceType;

  @ApiProperty({ enum: DepartmentType, example: DepartmentType.Software })
  @IsEnum(DepartmentType)
  department!: DepartmentType;

  @ApiPropertyOptional({ example: '101', maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  dormRoom?: string;

  @ApiProperty({ example: '😊💎✏️', maxLength: 30, description: '이모지 3개' })
  @IsString()
  @MaxLength(30)
  emojiSummary!: string;

  @ApiProperty({ example: '개발자로 성장하고 싶습니다.', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  motivation!: string;

  @ApiProperty({
    example: '협업 경험과 문제 해결 경험을 바탕으로...',
    maxLength: 250,
  })
  @IsString()
  @MaxLength(250)
  selfIntroduction!: string;

  @ApiProperty({
    example: '7ef91ec2-d6f6-4afc-96da-6b1df4f665d6',
    description: '/apply/queue/enter 에서 받은 ticketId',
  })
  @IsString()
  ticketId!: string;
}
