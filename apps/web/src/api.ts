import { Project, ProjectInput, User, UserInput } from './domain';
import { demo } from './demo';
export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';
const base = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');
async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${base}${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      'Não foi possível conectar à HeroForce. Verifique sua conexão e tente novamente.',
    );
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    if (response.status === 401 && !['/auth/login', '/auth/register', '/auth/me'].includes(path))
      window.dispatchEvent(new Event('session-expired'));
    throw Object.assign(
      new Error(
        Array.isArray(error.message)
          ? error.message.join(' • ')
          : (error.message ?? 'Não foi possível concluir esta ação.'),
      ),
      { status: response.status },
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
const real = {
  async me() {
    try {
      return await request<User>('/auth/me');
    } catch (error) {
      if ((error as { status?: number }).status === 401) return null;
      throw error;
    }
  },
  login: (email: string, password: string) =>
    request<User>('/auth/login', 'POST', { email, password }),
  register: (input: UserInput) =>
    request<User>('/auth/register', 'POST', {
      name: input.name,
      email: input.email,
      character: input.character,
      password: input.password,
    }),
  logout: () => request<void>('/auth/logout', 'POST'),
  users: () => request<User[]>('/users'),
  projects: () => request<Project[]>('/projects'),
  saveProject: (input: ProjectInput, id?: string) =>
    request<Project>(id ? `/projects/${id}` : '/projects', id ? 'PATCH' : 'POST', {
      ...input,
      goals: input.goals.map(({ value, description, completed }) => ({
        value,
        description,
        completed,
      })),
    }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, 'DELETE'),
  createUser: (input: UserInput) => request<User>('/users', 'POST', input),
  updateUser: (id: string, input: UserInput, own = false) =>
    request<User>(own ? '/users/me' : `/users/${id}`, 'PATCH', {
      name: input.name,
      email: input.email,
      character: input.character,
      ...(!own && input.role ? { role: input.role } : {}),
    }),
  deleteUser: (id: string) => request<void>(`/users/${id}`, 'DELETE'),
};
export const api = IS_DEMO ? demo : real;
