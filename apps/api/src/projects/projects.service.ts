import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Actor, ProjectStatus, Role, projectProgress, resolveStatus } from '../common/domain';
import { UsersService } from '../users/users.service';
import { publicUser } from '../users/user.entity';
import { Goal, Project } from './project.entity';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './project.dto';
@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private readonly projects: Repository<Project>,
    private readonly users: UsersService,
  ) {}
  async list(actor: Actor, filters: ProjectQueryDto) {
    const query = this.projects
      .createQueryBuilder('project')
      .leftJoinAndSelect('project.owner', 'owner')
      .leftJoinAndSelect('project.goals', 'goals')
      .orderBy('project.createdAt', 'DESC')
      .addOrderBy('goals.id', 'ASC');
    if (actor.role !== Role.ADMIN)
      query.andWhere('project.ownerId = :actorId', { actorId: actor.id });
    if (filters.ownerId) query.andWhere('project.ownerId = :ownerId', { ownerId: filters.ownerId });
    if (filters.status) query.andWhere('project.status = :status', { status: filters.status });
    if (filters.search?.trim())
      query.andWhere('(project.name ILIKE :search OR project.description ILIKE :search)', {
        search: `%${filters.search.trim().replace(/[\\%_]/g, '\\$&')}%`,
      });
    return (await query.getMany()).map((project) => this.serialize(project));
  }
  async find(id: string, actor: Actor) {
    const project = await this.projects.findOne({
      where: { id, ...(actor.role !== Role.ADMIN ? { ownerId: actor.id } : {}) },
      relations: { owner: true },
    });
    if (!project) throw new NotFoundException('Projeto não encontrado.');
    return project;
  }
  async create(input: CreateProjectDto, actor: Actor) {
    this.requireAdmin(actor);
    await this.users.find(input.ownerId);
    const goals = this.prepareGoals(input.goals, input.status);
    const project = this.projects.create({
      ...input,
      goals,
      status: resolveStatus(goals, input.status),
      dueDate: input.dueDate ?? null,
    });
    await this.projects.save(project);
    return this.serialize(await this.find(project.id, actor));
  }
  async update(id: string, input: UpdateProjectDto, actor: Actor) {
    this.requireAdmin(actor);
    const project = await this.find(id, actor);
    if (input.ownerId) project.owner = await this.users.find(input.ownerId);
    const goals = this.prepareGoals(
      input.goals ??
        project.goals.map((g) => ({
          value: g.value,
          description: g.description,
          completed: g.completed,
        })),
      input.status,
    );
    Object.assign(project, {
      ...input,
      goals,
      status: resolveStatus(goals, input.status, project.status),
    });
    await this.projects.save(project);
    return this.serialize(await this.find(id, actor));
  }
  async remove(id: string, actor: Actor) {
    this.requireAdmin(actor);
    await this.find(id, actor);
    await this.projects.delete(id);
  }
  serialize(project: Project) {
    return {
      ...project,
      owner: publicUser(project.owner),
      goals: project.goals.map(({ id, value, description, completed }) => ({
        id,
        value,
        description,
        completed,
      })),
      progress: projectProgress(project.goals),
    };
  }
  private prepareGoals(
    input: { value: Goal['value']; description: string; completed: boolean }[],
    status?: ProjectStatus,
  ) {
    return input.map((g) =>
      Object.assign(new Goal(), {
        value: g.value,
        description: g.description,
        completed:
          status === ProjectStatus.DONE
            ? true
            : status === ProjectStatus.PENDING
              ? false
              : g.completed,
      }),
    );
  }
  private requireAdmin(actor: Actor) {
    if (actor.role !== Role.ADMIN)
      throw new ForbiddenException('Esta ação é exclusiva de administradores.');
  }
}
