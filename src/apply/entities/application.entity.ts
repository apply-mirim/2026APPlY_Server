import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

export enum GenderType {
  Female = 'female',
  Male = 'male',
}

export enum ResidenceType {
  Commuter = 'commuter',
  Dormitory = 'dormitory',
}

export enum DepartmentType {
  Software = 'software',
  Design = 'design',
}

@Entity('applications')
@Unique('UQ_application_student_id', ['studentId'])
@Unique('UQ_application_phone_number', ['phoneNumber'])
export class ApplicationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  name!: string;

  @Column({ type: 'varchar', length: 30 })
  studentId!: string;

  @Column({ type: 'varchar', length: 20 })
  phoneNumber!: string;

  @Column({ type: 'varchar', length: 6 })
  birthDate!: string;

  @Column({ type: 'enum', enum: GenderType })
  gender!: GenderType;

  @Column({ type: 'enum', enum: ResidenceType })
  residenceType!: ResidenceType;

  @Column({ type: 'enum', enum: DepartmentType })
  department!: DepartmentType;

  @Column({ type: 'varchar', length: 20, nullable: true })
  dormRoom!: string | null;

  @Column({ type: 'varchar', length: 30 })
  emojiSummary!: string;

  @Column({ type: 'varchar', length: 200 })
  motivation!: string;

  @Column({ type: 'varchar', length: 250 })
  selfIntroduction!: string;

  @CreateDateColumn()
  submittedAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt!: Date | null;
}
