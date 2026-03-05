import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminLoginDto {
  @ApiProperty({
    example: 'admin',
    description: 'ENV ADMIN_USERNAME 과 일치해야 하는 어드민 아이디',
  })
  @IsString()
  username!: string;

  @ApiProperty({
    example: 'admin1234',
    description: 'ENV ADMIN_PASSWORD 또는 bcrypt 해시 대응 비밀번호',
  })
  @IsString()
  @MinLength(1)
  password!: string;
}
