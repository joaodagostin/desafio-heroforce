import { beforeEach, describe, expect, it, vi } from 'vitest';
import { demo } from './demo';
import { filterProjects, progress, VALUES } from './domain';
const memory = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => memory.set(key, value),
  removeItem: (key: string) => memory.delete(key),
});
beforeEach(() => memory.clear());
describe('Dashboard and demo permissions', () => {
  it('calculates real progress, including empty goals', () => {
    expect(progress([])).toBe(0);
    expect(
      progress(VALUES.map((v, i) => ({ value: v.key, description: v.goal, completed: i < 4 }))),
    ).toBe(67);
  });
  it('combines filters and searches accent-insensitively', async () => {
    await demo.me();
    const projects = await demo.projects();
    expect(filterProjects(projects, 'concluido', '', 'fenix')).toHaveLength(1);
    expect(filterProjects(projects, 'pendente', '', 'fenix')).toHaveLength(0);
    expect(filterProjects(projects, '', projects[0].ownerId, '')).toHaveLength(1);
  });
  it('restricts heroes to their missions and prevents admin actions', async () => {
    await demo.me();
    await demo.login('peter@heroforce.dev', 'Hero@12345');
    const user = await demo.me();
    const projects = await demo.projects();
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((p) => p.ownerId === user!.id)).toBe(true);
    await expect(demo.deleteProject(projects[0].id)).rejects.toThrow('administradores');
  });
  it('registers a new hero without granting access to existing projects', async () => {
    await demo.me();
    const user = await demo.register({
      name: 'Novo Herói',
      email: 'new@hero.dev',
      password: 'NewHero123',
      character: 'Batman',
      role: 'admin',
    });
    expect(user.role).toBe('hero');
    expect(await demo.projects()).toHaveLength(0);
    await demo.logout();
    expect(await demo.me()).toBeNull();
    await expect(demo.login(user.email, 'wrong')).rejects.toThrow('incorretos');
    expect((await demo.login(user.email, 'NewHero123')).id).toBe(user.id);
  });
  it('preserves projects when the assigned hero is removed', async () => {
    await demo.me();
    const project = (await demo.projects())[0];
    await expect(demo.deleteUser(project.ownerId)).rejects.toThrow('Reatribua');
    expect((await demo.projects()).find((p) => p.id === project.id)).toBeDefined();
  });
});
