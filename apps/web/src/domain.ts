export type Role = 'admin' | 'hero';
export type Status = 'pendente' | 'em_andamento' | 'concluido';
export const CHARACTERS = [
  'Homem-Aranha',
  'Homem de Ferro',
  'Mulher-Maravilha',
  'Batman',
  'Pantera Negra',
  'Doutor Estranho',
  'Capitã Marvel',
  'Capitão América',
];
export const VALUES = [
  {
    key: 'agilidade',
    label: 'Agilidade',
    color: '#7eaf37',
    text: 'Transformar ideias em ação, com foco no que importa.',
    goal: 'Entregar a primeira versão no prazo',
  },
  {
    key: 'encantamento',
    label: 'Encantamento',
    color: '#be71b8',
    text: 'Criar experiências que surpreendam e façam a diferença.',
    goal: 'Validar a experiência com cinco usuários',
  },
  {
    key: 'eficiencia',
    label: 'Eficiência',
    color: '#558eca',
    text: 'Fazer mais com propósito, simplicidade e menos desperdício.',
    goal: 'Reduzir atividades manuais em 30%',
  },
  {
    key: 'excelencia',
    label: 'Excelência',
    color: '#d4a048',
    text: 'Cuidar dos detalhes para entregar algo do qual se orgulhar.',
    goal: 'Concluir a revisão de qualidade',
  },
  {
    key: 'transparencia',
    label: 'Transparência',
    color: '#50a58e',
    text: 'Compartilhar avanços, desafios e decisões com clareza.',
    goal: 'Compartilhar o progresso com a equipe',
  },
  {
    key: 'ambicao',
    label: 'Ambição',
    color: '#9d83d5',
    text: 'Pensar além e buscar o próximo grande impacto.',
    goal: 'Superar a meta inicial do projeto',
  },
] as const;
export type ValueKey = (typeof VALUES)[number]['key'];
export interface User {
  id: string;
  name: string;
  email: string;
  character: string;
  role: Role;
  createdAt: string;
}
export interface Goal {
  id?: string;
  value: ValueKey;
  description: string;
  completed: boolean;
}
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  owner: User;
  status: Status;
  goals: Goal[];
  progress: number;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface ProjectInput {
  name: string;
  description: string;
  ownerId: string;
  status?: Status;
  goals: Goal[];
  dueDate: string | null;
}
export interface UserInput {
  name: string;
  email: string;
  character: string;
  password?: string;
  role?: Role;
}
export const STATUS: Record<Status, { label: string; short: string }> = {
  pendente: { label: 'Pendente', short: 'Pendentes' },
  em_andamento: { label: 'Em andamento', short: 'Em andamento' },
  concluido: { label: 'Concluído', short: 'Concluídos' },
};
export function progress(goals: Goal[]) {
  return goals.length
    ? Math.round((goals.filter((g) => g.completed).length / goals.length) * 100)
    : 0;
}
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}
export function dueLabel(date: string | null) {
  return date
    ? new Date(date + 'T12:00:00')
        .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
        .replace('.', '')
    : 'Sem prazo';
}
export function isOverdue(project: Project) {
  const today = new Date();
  const key = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');
  return !!project.dueDate && project.status !== 'concluido' && project.dueDate < key;
}
export function filterProjects(
  projects: Project[],
  status: string,
  ownerId: string,
  search: string,
) {
  const normalized = search
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
  return projects.filter(
    (p) =>
      (!status || p.status === status) &&
      (!ownerId || p.ownerId === ownerId) &&
      `${p.name} ${p.description} ${p.owner.name} ${p.owner.character}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(normalized),
  );
}
