import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum AnalyticsEventType {
  PageView = 'page_view',
  Click = 'click',
  Scroll = 'scroll',
  SessionMeta = 'session_meta',
}

@Entity('analytics_events')
export class AnalyticsEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  sessionId!: string;

  @Column({ type: 'enum', enum: AnalyticsEventType })
  eventType!: AnalyticsEventType;

  @Column({ type: 'varchar', length: 255 })
  pagePath!: string;

  @Column({ type: 'int', nullable: true })
  durationMs!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  payload!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
