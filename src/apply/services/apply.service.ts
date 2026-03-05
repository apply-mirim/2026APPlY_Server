import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { QueueService } from '../../queue/queue.service';
import {
  ApplicationEntity,
  ResidenceType,
} from '../entities/application.entity';
import { SubmitApplicationDto } from '../dtos/submit-application.dto';
import { ApplicationPeriodService } from './application-period.service';

@Injectable()
export class ApplyService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepository: Repository<ApplicationEntity>,
    private readonly queueService: QueueService,
    private readonly periodService: ApplicationPeriodService,
  ) {}

  private validateEmojiSummary(value: string) {
    const emojis = Array.from(value.trim()).filter((char) =>
      /\p{Extended_Pictographic}/u.test(char),
    );

    if (emojis.length !== 3) {
      throw new BadRequestException(
        '나를 표현하는 이모지는 정확히 3개여야 합니다.',
      );
    }
  }

  async enterQueue() {
    return this.queueService.enterQueue();
  }

  async getQueueStatus(ticketId: string) {
    const status = await this.queueService.getStatus(ticketId);
    if (status.position === -1) {
      throw new NotFoundException('유효하지 않은 대기열 티켓입니다.');
    }

    return status;
  }

  async submit(dto: SubmitApplicationDto) {
    await this.periodService.assertOpen();

    const isFront = await this.queueService.isFront(dto.ticketId);
    if (!isFront) {
      throw new ConflictException('아직 대기 순서가 아닙니다.');
    }

    this.validateEmojiSummary(dto.emojiSummary);

    if (dto.residenceType === ResidenceType.Dormitory && !dto.dormRoom) {
      throw new BadRequestException('기숙사생은 기숙사 호실이 필요합니다.');
    }

    await this.queueService.popFront(dto.ticketId);

    const entity = this.applicationRepository.create({
      name: dto.name,
      studentId: dto.studentId,
      phoneNumber: dto.phoneNumber,
      birthDate: dto.birthDate,
      gender: dto.gender,
      residenceType: dto.residenceType,
      department: dto.department,
      dormRoom: dto.dormRoom ?? null,
      emojiSummary: dto.emojiSummary,
      motivation: dto.motivation,
      selfIntroduction: dto.selfIntroduction,
    });

    try {
      const saved = await this.applicationRepository.save(entity);
      return {
        id: saved.id,
        submittedAt: saved.submittedAt,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driverError = error.driverError as {
          code?: string;
          constraint?: string;
        };
        if (driverError.code === '23505') {
          if (driverError.constraint?.includes('student')) {
            throw new ConflictException('이미 등록된 학번입니다.');
          }

          if (driverError.constraint?.includes('phone')) {
            throw new ConflictException('이미 등록된 전화번호입니다.');
          }

          throw new ConflictException('중복된 지원 정보가 있습니다.');
        }
      }

      throw error;
    }
  }

  async findAll() {
    const items = await this.applicationRepository.find({
      withDeleted: false,
      order: { submittedAt: 'DESC' },
    });

    return items;
  }

  async remove(id: string) {
    const existing = await this.applicationRepository.findOne({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('지원자를 찾을 수 없습니다.');
    }

    await this.applicationRepository.softDelete(id);
    return {
      id,
      deleted: true,
    };
  }

  async exportExcel() {
    const rows = await this.applicationRepository.find({
      withDeleted: false,
      order: { submittedAt: 'DESC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Applicants');

    worksheet.columns = [
      { header: '이름', key: 'name', width: 16 },
      { header: '학번', key: 'studentId', width: 16 },
      { header: '전화번호', key: 'phoneNumber', width: 18 },
      { header: '생년월일', key: 'birthDate', width: 12 },
      { header: '성별', key: 'gender', width: 10 },
      { header: '기숙사 여부', key: 'residenceType', width: 12 },
      { header: '학과', key: 'department', width: 12 },
      { header: '기숙사 호실', key: 'dormRoom', width: 12 },
      { header: '이모지 3개', key: 'emojiSummary', width: 14 },
      { header: '지원동기', key: 'motivation', width: 40 },
      { header: '자소서', key: 'selfIntroduction', width: 40 },
      { header: '제출시각', key: 'submittedAt', width: 24 },
    ];

    rows.forEach((row) => {
      worksheet.addRow({
        ...row,
        submittedAt: row.submittedAt.toISOString(),
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}
