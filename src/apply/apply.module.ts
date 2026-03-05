import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { QueueModule } from '../queue/queue.module';
import { ApplicationEntity } from './entities/application.entity';
import { ApplicationPeriodEntity } from './entities/application-period.entity';
import { ApplyController } from './apply.controller';
import { AdminApplyController } from './admin-apply.controller';
import { ApplyService } from './services/apply.service';
import { ApplicationPeriodService } from './services/application-period.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, ApplicationPeriodEntity]),
    QueueModule,
    AuthModule,
  ],
  controllers: [ApplyController, AdminApplyController],
  providers: [ApplyService, ApplicationPeriodService],
  exports: [ApplyService, ApplicationPeriodService],
})
export class ApplyModule {}
