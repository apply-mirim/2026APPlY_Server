import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('qna_items')
export class QnaEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  authorName!: string | null;

  @Column({ type: 'varchar', length: 400 })
  question!: string;

  @Column({ type: 'varchar', length: 800, nullable: true })
  answer!: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  answeredBy!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  answeredAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
