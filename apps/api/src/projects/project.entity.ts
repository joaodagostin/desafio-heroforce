import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { ProjectStatus, Value } from '../common/domain';
@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 120 }) name!: string;
  @Column({ type: 'text' }) description!: string;
  @Column({ type: 'varchar', default: ProjectStatus.PENDING }) status!: ProjectStatus;
  @Column({ type: 'uuid' }) ownerId!: string;
  @ManyToOne(() => User, (user) => user.projects, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;
  @OneToMany(() => Goal, (goal) => goal.project, { cascade: true, eager: true }) goals!: Goal[];
  @Column({ type: 'date', nullable: true }) dueDate!: string | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt!: Date;
}
@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar' }) value!: Value;
  @Column({ type: 'varchar', length: 200 }) description!: string;
  @Column({ type: 'boolean', default: false }) completed!: boolean;
  @ManyToOne(() => Project, (project) => project.goals, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
    nullable: false,
  })
  project!: Project;
}
