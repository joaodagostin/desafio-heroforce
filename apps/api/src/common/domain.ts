export enum Role {
  ADMIN = 'admin',
  HERO = 'hero',
}
export enum ProjectStatus {
  PENDING = 'pendente',
  ACTIVE = 'em_andamento',
  DONE = 'concluido',
}
export enum Value {
  AGILITY = 'agilidade',
  DELIGHT = 'encantamento',
  EFFICIENCY = 'eficiencia',
  EXCELLENCE = 'excelencia',
  TRANSPARENCY = 'transparencia',
  AMBITION = 'ambicao',
}
export const CHARACTERS = [
  'Homem-Aranha',
  'Homem de Ferro',
  'Mulher-Maravilha',
  'Batman',
  'Pantera Negra',
  'Doutor Estranho',
  'Capitã Marvel',
  'Capitão América',
] as const;
export interface Actor {
  id: string;
  role: Role;
}
export function projectProgress(goals: { completed: boolean }[]) {
  return goals.length
    ? Math.round((goals.filter((g) => g.completed).length / goals.length) * 100)
    : 0;
}
export function resolveStatus(
  goals: { completed: boolean }[],
  requested?: ProjectStatus,
  current?: ProjectStatus,
) {
  const progress = projectProgress(goals);
  if (progress === 100) return ProjectStatus.DONE;
  if (
    progress > 0 ||
    requested === ProjectStatus.ACTIVE ||
    (!requested && current === ProjectStatus.ACTIVE)
  )
    return ProjectStatus.ACTIVE;
  return ProjectStatus.PENDING;
}
