import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QnaEntity } from './entities/qna.entity';
import { CreateQnaDto } from './dtos/create-qna.dto';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(QnaEntity)
    private readonly qnaRepository: Repository<QnaEntity>,
  ) {}

  async create(dto: CreateQnaDto) {
    const item = this.qnaRepository.create({
      authorName: dto.authorName?.trim() || null,
      question: dto.question,
      answer: null,
      answeredBy: null,
      answeredAt: null,
    });

    const saved = await this.qnaRepository.save(item);
    return saved;
  }

  async list() {
    return this.qnaRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async answer(id: string, answer: string, adminUsername: string) {
    const item = await this.qnaRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('질문을 찾을 수 없습니다.');
    }

    item.answer = answer;
    item.answeredBy = adminUsername;
    item.answeredAt = new Date();

    return this.qnaRepository.save(item);
  }
}
