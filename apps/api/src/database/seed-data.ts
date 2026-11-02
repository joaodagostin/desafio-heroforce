import { DataSource } from 'typeorm';
import { hash } from 'bcryptjs';
import { User } from '../users/user.entity';
import { Project } from '../projects/project.entity';
import { ProjectStatus, Role, Value } from '../common/domain';
export async function seedDatabase(data: DataSource) {
  const users = data.getRepository(User);
  if (await users.count()) return;
  const passwordHash = await hash(process.env.SEED_ADMIN_PASSWORD ?? 'Hero@12345', 12);
  await data.transaction(async (manager) => {
    const saved = await manager.save(User, [
      {
        name: 'Alex Morgan',
        email: process.env.SEED_ADMIN_EMAIL ?? 'admin@heroforce.dev',
        character: 'Homem de Ferro',
        role: Role.ADMIN,
        passwordHash,
      },
      {
        name: 'Peter Parker',
        email: 'peter@heroforce.dev',
        character: 'Homem-Aranha',
        role: Role.HERO,
        passwordHash,
      },
      {
        name: 'Diana Prince',
        email: 'diana@heroforce.dev',
        character: 'Mulher-Maravilha',
        role: Role.HERO,
        passwordHash,
      },
      {
        name: 'Bruce Wayne',
        email: 'bruce@heroforce.dev',
        character: 'Batman',
        role: Role.HERO,
        passwordHash,
      },
      {
        name: 'T’Challa',
        email: 'tchalla@heroforce.dev',
        character: 'Pantera Negra',
        role: Role.HERO,
        passwordHash,
      },
    ]);
    const names = [
      'Protocolo Vingadores',
      'Conexão Multiverso',
      'Escudo de Wakanda',
      'Operação Gotham',
      'Iniciativa Fênix',
      'Projeto Nova Era',
    ];
    const descriptions = [
      'Unificar a comunicação da equipe para transformar grandes ideias em missões de impacto.',
      'Criar uma experiência que conecte pessoas, equipes e possibilidades em um só lugar.',
      'Fortalecer a infraestrutura e garantir segurança em cada etapa da jornada.',
      'Levar mais transparência e inteligência para as operações de toda a cidade.',
      'Reimaginar a jornada dos nossos clientes com uma experiência memorável.',
      'Preparar a próxima geração de soluções com mais eficiência e escala.',
    ];
    const goalDescriptions = [
      'Entregar a primeira versão no prazo',
      'Validar a experiência com cinco usuários',
      'Reduzir atividades manuais em 30%',
      'Concluir a revisão de qualidade',
      'Compartilhar o progresso com a equipe',
      'Superar a meta inicial do projeto',
    ];
    const completedCounts = [4, 2, 5, 0, 6, 0];
    for (let i = 0; i < names.length; i++) {
      const days = new Date();
      days.setDate(days.getDate() + [12, 18, 7, 24, -2, 30][i]);
      await manager.save(
        Project,
        manager.create(Project, {
          name: names[i],
          description: descriptions[i],
          ownerId: saved[[1, 2, 4, 3, 2, 0][i]].id,
          status:
            completedCounts[i] === 6
              ? ProjectStatus.DONE
              : completedCounts[i]
                ? ProjectStatus.ACTIVE
                : ProjectStatus.PENDING,
          dueDate: days.toISOString().slice(0, 10),
          goals: Object.values(Value).map((value, n) => ({
            value,
            description: goalDescriptions[n],
            completed: n < completedCounts[i],
          })),
        }),
      );
    }
  });
}
