import { compare, hash } from 'bcryptjs';
import { Goal, Project, ProjectInput, Role, User, UserInput, VALUES, progress } from './domain';
function uuid() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
const KEY = 'heroforce.demo.v1';
const SESSION = 'heroforce.demo.session.v1';
type DemoUser = User & { passwordDigest?: string };
interface Store {
  users: DemoUser[];
  projects: Project[];
}
function initial(): Store {
  const now = new Date().toISOString();
  const users: User[] = [
    {
      id: uuid(),
      name: 'Alex Morgan',
      email: 'admin@heroforce.dev',
      character: 'Homem de Ferro',
      role: 'admin',
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'Peter Parker',
      email: 'peter@heroforce.dev',
      character: 'Homem-Aranha',
      role: 'hero',
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'Diana Prince',
      email: 'diana@heroforce.dev',
      character: 'Mulher-Maravilha',
      role: 'hero',
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'Bruce Wayne',
      email: 'bruce@heroforce.dev',
      character: 'Batman',
      role: 'hero',
      createdAt: now,
    },
    {
      id: uuid(),
      name: 'T’Challa',
      email: 'tchalla@heroforce.dev',
      character: 'Pantera Negra',
      role: 'hero',
      createdAt: now,
    },
  ];
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
  const counts = [4, 2, 5, 0, 6, 0];
  const projects: Project[] = names.map((name, i) => {
    const day = new Date();
    day.setDate(day.getDate() + [12, 18, 7, 24, -2, 30][i]);
    const owner = users[[1, 2, 4, 3, 2, 0][i]];
    const goals: Goal[] = VALUES.map((v, n) => ({
      id: uuid(),
      value: v.key,
      description: v.goal,
      completed: n < counts[i],
    }));
    return {
      id: uuid(),
      name,
      description: descriptions[i],
      ownerId: owner.id,
      owner,
      status: counts[i] === 6 ? 'concluido' : counts[i] ? 'em_andamento' : 'pendente',
      goals,
      progress: progress(goals),
      dueDate: day.toISOString().slice(0, 10),
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
      updatedAt: now,
    };
  });
  return { users, projects };
}
function store(): Store {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Store;
    } catch {
      throw new Error(
        'Os dados da demonstração estão inválidos. Limpe os dados deste site para reiniciar.',
      );
    }
  }
  const data = initial();
  save(data);
  if (localStorage.getItem(SESSION) === null)
    localStorage.setItem(SESSION, JSON.stringify(data.users[0].id));
  return data;
}
function save(data: Store) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
function safe(user: DemoUser): User {
  const { passwordDigest: _digest, ...publicUser } = user;
  return publicUser;
}
function actor(): User {
  const data = store();
  const id = JSON.parse(localStorage.getItem(SESSION) ?? 'null');
  const user = data.users.find((u) => u.id === id);
  if (!user) throw new Error('Entre na sua conta para continuar.');
  return safe(user);
}
function admin() {
  const user = actor();
  if (user.role !== 'admin') throw new Error('Esta ação é exclusiva de administradores.');
  return user;
}
async function digest(password: string) {
  return hash(password, 8);
}
function normalize(input: UserInput) {
  return { ...input, name: input.name.trim(), email: input.email.trim().toLowerCase() };
}
export const demo = {
  async me() {
    store();
    try {
      return actor();
    } catch {
      return null;
    }
  },
  async login(email: string, password: string) {
    const data = store();
    const user = data.users.find((u) => u.email === email.trim().toLowerCase());
    if (
      !user ||
      (user.passwordDigest
        ? !(await compare(password, user.passwordDigest))
        : password !== 'Hero@12345')
    )
      throw new Error('E-mail ou senha incorretos.');
    localStorage.setItem(SESSION, JSON.stringify(user.id));
    return safe(user);
  },
  async logout() {
    localStorage.setItem(SESSION, 'null');
  },
  async register(input: UserInput) {
    const user = await this.createUser({ ...input, role: 'hero' }, true);
    localStorage.setItem(SESSION, JSON.stringify(user.id));
    return user;
  },
  async users() {
    const user = actor();
    return user.role === 'admin' ? store().users.map(safe) : [user];
  },
  async projects() {
    const user = actor();
    const data = store();
    return data.projects
      .filter((p) => user.role === 'admin' || p.ownerId === user.id)
      .map((p) => ({ ...p, owner: safe(data.users.find((u) => u.id === p.ownerId)!) }));
  },
  async saveProject(input: ProjectInput, id?: string) {
    admin();
    const data = store();
    const owner = data.users.find((u) => u.id === input.ownerId);
    if (!owner) throw new Error('Herói não encontrado.');
    const current = id ? data.projects.find((p) => p.id === id) : undefined;
    if (id && !current) throw new Error('Projeto não encontrado.');
    const goals = input.goals.map((g) => ({
      ...g,
      id: g.id ?? uuid(),
      completed:
        input.status === 'concluido' ? true : input.status === 'pendente' ? false : g.completed,
    }));
    const percent = progress(goals);
    const project: Project = {
      ...input,
      goals,
      id: id ?? uuid(),
      owner: safe(owner),
      progress: percent,
      status:
        percent === 100
          ? 'concluido'
          : percent > 0 ||
              input.status === 'em_andamento' ||
              (!input.status && current?.status === 'em_andamento')
            ? 'em_andamento'
            : 'pendente',
      createdAt: current?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.projects = current
      ? data.projects.map((p) => (p.id === id ? project : p))
      : [project, ...data.projects];
    save(data);
    return project;
  },
  async deleteProject(id: string) {
    admin();
    const data = store();
    data.projects = data.projects.filter((p) => p.id !== id);
    save(data);
  },
  async createUser(input: UserInput, registration = false) {
    if (!registration) admin();
    const data = store();
    const normalized = normalize(input);
    if (data.users.some((u) => u.email === normalized.email))
      throw new Error('Este e-mail já está cadastrado.');
    const user: DemoUser = {
      id: uuid(),
      name: normalized.name,
      email: normalized.email,
      character: normalized.character,
      role: registration ? 'hero' : (input.role ?? 'hero'),
      passwordDigest: await digest(input.password ?? ''),
      createdAt: new Date().toISOString(),
    };
    data.users.push(user);
    save(data);
    return safe(user);
  },
  async updateUser(id: string, input: UserInput, own = false) {
    const me = own ? actor() : admin();
    if (own && me.id !== id) throw new Error('Sem permissão.');
    if (me.id === id && input.role && input.role !== me.role)
      throw new Error('Você não pode alterar seu próprio nível de acesso.');
    const data = store();
    const normalized = normalize(input);
    if (data.users.some((u) => u.id !== id && u.email === normalized.email))
      throw new Error('Este e-mail já está cadastrado.');
    const user = data.users.find((u) => u.id === id);
    if (!user) throw new Error('Herói não encontrado.');
    Object.assign(user, {
      name: normalized.name,
      email: normalized.email,
      character: normalized.character,
      ...(!own && input.role ? { role: input.role as Role } : {}),
    });
    save(data);
    return safe(user);
  },
  async deleteUser(id: string) {
    const me = admin();
    const data = store();
    if (me.id === id) throw new Error('Você não pode excluir sua própria conta.');
    if (data.projects.some((p) => p.ownerId === id))
      throw new Error('Reatribua ou exclua os projetos deste herói antes de removê-lo.');
    data.users = data.users.filter((u) => u.id !== id);
    save(data);
  },
};
