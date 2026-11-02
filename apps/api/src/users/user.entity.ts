import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from '../common/domain';
import { Project } from '../projects/project.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ type: 'varchar', length: 100 }) name!: string;
  @Column({ type: 'varchar', length: 180, unique: true }) email!: string;
  @Column({ type: 'varchar', length: 60 }) character!: string;
  @Column({ type: 'varchar', select: false }) passwordHash!: string;
  @Column({ type: 'varchar', default: Role.HERO }) role!: Role;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
  @OneToMany(() => Project, (project) => project.owner) projects!: Project[];
}
export const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  character: user.character,
  role: user.role,
  createdAt: user.createdAt,
});
