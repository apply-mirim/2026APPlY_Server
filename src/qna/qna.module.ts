import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QnaEntity } from './entities/qna.entity';
import { QnaController } from './qna.controller';
import { QnaService } from './qna.service';

@Module({
  imports: [TypeOrmModule.forFeature([QnaEntity]), AuthModule],
  controllers: [QnaController],
  providers: [QnaService],
})
export class QnaModule {}
