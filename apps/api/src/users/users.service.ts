import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { hash } from 'bcryptjs';
import { Role } from '../common/domain';
import { User, publicUser } from './user.entity';
import { Project } from '../projects/project.entity';
import { CreateUserDto, RegisterDto, UpdateUserDto } from './user.dto';
@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}
  async create(input: RegisterDto | CreateUserDto, admin = false) {
    if (await this.users.existsBy({ email: input.email }))
      throw new ConflictException('Este e-mail já está cadastrado.');
    const user = this.users.create({
      name: input.name,
      email: input.email,
      character: input.character,
      passwordHash: await hash(input.password, 12),
      role: admin ? ((input as CreateUserDto).role ?? Role.HERO) : Role.HERO,
    });
    try {
      return publicUser(await this.users.save(user));
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }
  async find(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new NotFoundException('Herói não encontrado.');
    return user;
  }
  async credentials(email: string) {
    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();
  }
  async list() {
    return (await this.users.find({ order: { name: 'ASC' } })).map(publicUser);
  }
  async update(id: string, input: UpdateUserDto, actorId: string) {
    const user = await this.find(id);
    if (actorId === id && input.role && input.role !== user.role)
      throw new ForbiddenException('Você não pode alterar seu próprio nível de acesso.');
    Object.assign(user, input);
    try {
      return publicUser(await this.users.save(user));
    } catch (error) {
      this.rethrowDuplicate(error);
      throw error;
    }
  }
  async remove(id: string, actorId: string) {
    if (id === actorId)
      throw new ForbiddenException('Você não pode excluir sua própria conta por este painel.');
    await this.find(id);
    if (await this.users.manager.getRepository(Project).existsBy({ ownerId: id }))
      throw new ConflictException(
        'Reatribua ou exclua os projetos deste herói antes de removê-lo.',
      );
    try {
      await this.users.delete(id);
    } catch (error) {
      if ((error as { code?: string }).code === '23503')
        throw new ConflictException(
          'Reatribua ou exclua os projetos deste herói antes de removê-lo.',
        );
      throw error;
    }
  }
  private rethrowDuplicate(error: unknown) {
    if ((error as { code?: string }).code === '23505')
      throw new ConflictException('Este e-mail já está cadastrado.');
  }
}
