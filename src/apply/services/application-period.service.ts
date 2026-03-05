import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationPeriodEntity } from '../entities/application-period.entity';

@Injectable()
export class ApplicationPeriodService {
  constructor(
    @InjectRepository(ApplicationPeriodEntity)
    private readonly periodRepository: Repository<ApplicationPeriodEntity>,
  ) {}

  private async ensurePeriod(): Promise<ApplicationPeriodEntity> {
    const existing = await this.periodRepository.findOne({
      where: { id: 1 },
    });

    if (existing) {
      return existing;
    }

    const now = new Date();
    const startsAt = new Date(now.getTime() - 60 * 60 * 1000);
    const endsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const created = this.periodRepository.create({
      id: 1,
      startsAt,
      endsAt,
    });

    return this.periodRepository.save(created);
  }

  async getPeriodStatus() {
    const period = await this.ensurePeriod();
    const now = new Date();
    const isOpen = now >= period.startsAt && now <= period.endsAt;

    return {
      startsAt: period.startsAt,
      endsAt: period.endsAt,
      isOpen,
    };
  }

  async assertOpen() {
    const status = await this.getPeriodStatus();
    if (!status.isOpen) {
      throw new BadRequestException('현재 지원 가능 기간이 아닙니다.');
    }
  }

  async updatePeriod(startsAt: string, endsAt: string) {
    const startDate = new Date(startsAt);
    const endDate = new Date(endsAt);

    if (startDate >= endDate) {
      throw new BadRequestException(
        '지원 시작 시간은 종료 시간보다 빨라야 합니다.',
      );
    }

    let period = await this.periodRepository.findOne({ where: { id: 1 } });
    if (!period) {
      period = this.periodRepository.create({
        id: 1,
        startsAt: startDate,
        endsAt: endDate,
      });
    } else {
      period.startsAt = startDate;
      period.endsAt = endDate;
    }

    const saved = await this.periodRepository.save(period);
    return {
      startsAt: saved.startsAt,
      endsAt: saved.endsAt,
    };
  }
}
