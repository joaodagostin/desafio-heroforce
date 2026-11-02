import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { databaseOptions } from '../src/database/config';
import { Role, Value } from '../src/common/domain';
import { User } from '../src/users/user.entity';
import { Goal, Project } from '../src/projects/project.entity';
import { UsersService } from '../src/users/users.service';

process.env.JWT_SECRET = 'test-only-jwt-secret-with-more-than-32-characters';

describe('HeroForce API (HTTP + JWT + TypeORM)', () => {
  let app: INestApplication;
  let data: DataSource;
  let admin: ReturnType<typeof request.agent>;
  let hero: ReturnType<typeof request.agent>;
  let other: ReturnType<typeof request.agent>;
  let heroId: string;
  let otherId: string;
  let adminId: string;
  let projectId: string;
  const heroInput = {
    name: 'Peter Parker',
    email: 'peter@test.dev',
    password: 'Hero@12345',
    character: 'Homem-Aranha',
  };
  const goals = [Value.AGILITY, Value.EXCELLENCE].map((value, i) => ({
    value,
    description: `Entrega verificável ${i + 1}`,
    completed: i === 0,
  }));
  beforeAll(async () => {
    if (process.env.TEST_DATABASE_URL) {
      const url = new URL(process.env.TEST_DATABASE_URL);
      if (!url.pathname.endsWith('_test'))
        throw new Error('TEST_DATABASE_URL deve usar um banco com nome terminado em _test.');
      data = new DataSource({
        ...databaseOptions(),
        url: process.env.TEST_DATABASE_URL,
        dropSchema: true,
      });
    } else {
      const db = newDb({ autoCreateForeignKeyIndices: true });
      db.public.registerFunction({
        name: 'current_database',
        returns: DataType.text,
        implementation: () => 'heroforce_test',
      });
      db.public.registerFunction({
        name: 'version',
        returns: DataType.text,
        implementation: () => 'PostgreSQL 16.0',
      });
      db.registerExtension('pgcrypto', (schema) => {
        schema.registerFunction({
          name: 'gen_random_uuid',
          returns: DataType.uuid,
          implementation: randomUUID,
          impure: true,
        });
      });
      data = db.adapters.createTypeormDataSource({
        type: 'postgres',
        entities: [User, Project, Goal],
        synchronize: true,
        uuidExtension: 'pgcrypto',
      });
    }
    await data.initialize();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(DataSource)
      .useValue(data)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    const created = await app.get(UsersService).create(
      {
        name: 'Admin Test',
        email: 'admin@test.dev',
        password: 'Hero@12345',
        character: 'Homem de Ferro',
        role: Role.ADMIN,
      },
      true,
    );
    adminId = created.id;
    admin = request.agent(app.getHttpServer());
    hero = request.agent(app.getHttpServer());
    other = request.agent(app.getHttpServer());
    await admin
      .post('/api/auth/login')
      .send({ email: 'admin@test.dev', password: 'Hero@12345' })
      .expect(200);
    const response = await hero.post('/api/auth/register').send(heroInput).expect(201);
    heroId = response.body.id;
    const another = await other
      .post('/api/auth/register')
      .send({
        ...heroInput,
        email: 'diana@test.dev',
        name: 'Diana Prince',
        character: 'Mulher-Maravilha',
      })
      .expect(201);
    otherId = another.body.id;
  }, 30000);
  afterAll(async () => {
    if (app) await app.close();
    if (data?.isInitialized) await data.destroy();
  });
  it('denies unauthenticated access', async () => {
    await request(app.getHttpServer()).get('/api/projects').expect(401);
  });
  it('prevents public role escalation', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...heroInput, email: 'attacker@test.dev', role: 'admin' })
      .expect(400);
  });
  it('rejects duplicate emails and invalid credentials', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send(heroInput).expect(409);
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: heroInput.email, password: 'incorrect' })
      .expect(401);
  });
  it('uses HttpOnly cookies and excludes password hashes', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: heroInput.email, password: heroInput.password })
      .expect(200);
    expect(response.headers['set-cookie'][0]).toContain('HttpOnly');
    expect(response.headers['set-cookie'][0]).toContain('SameSite=Lax');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body.role).toBe('hero');
  });
  it('validates nested goals, unknown fields and owner references', async () => {
    const base = {
      name: 'Missão de teste',
      description: 'Uma missão para garantir regras de acesso.',
      ownerId: heroId,
      goals,
    };
    await admin
      .post('/api/projects')
      .send({ ...base, goals: [{ value: 'invalido', description: 'curta', completed: true }] })
      .expect(400);
    await admin
      .post('/api/projects')
      .send({ ...base, progress: 99 })
      .expect(400);
    await admin
      .post('/api/projects')
      .send({ ...base, ownerId: randomUUID() })
      .expect(404);
  });
  it('allows admin creation and calculates progress from goals', async () => {
    const response = await admin
      .post('/api/projects')
      .send({
        name: 'Missão de teste',
        description: 'Uma missão para garantir regras de acesso.',
        ownerId: heroId,
        goals,
      })
      .expect(201);
    projectId = response.body.id;
    expect(response.body.progress).toBe(50);
    expect(response.body.status).toBe('em_andamento');
    expect(response.body.owner.id).toBe(heroId);
    expect(response.body.owner).not.toHaveProperty('passwordHash');
  });
  it('isolates project lists and detail access by owner', async () => {
    expect((await admin.get('/api/projects').expect(200)).body).toHaveLength(1);
    expect((await hero.get('/api/projects').expect(200)).body).toHaveLength(1);
    expect((await other.get('/api/projects').expect(200)).body).toHaveLength(0);
    await other.get(`/api/projects/${projectId}`).expect(404);
    await hero.get(`/api/projects/${projectId}`).expect(200);
  });
  it('rejects hero project creation, update, deletion and user listing', async () => {
    await hero.post('/api/projects').send({}).expect(403);
    await hero.patch(`/api/projects/${projectId}`).send({ name: 'Ataque' }).expect(403);
    await hero.delete(`/api/projects/${projectId}`).expect(403);
    await hero.get('/api/users').expect(403);
    await hero.patch('/api/users/me').send({ role: 'admin' }).expect(400);
  });
  it('updates goals without leaving orphan rows and completes the project', async () => {
    const response = await admin
      .patch(`/api/projects/${projectId}`)
      .send({ goals: goals.map((g) => ({ ...g, completed: true })) })
      .expect(200);
    expect(response.body.progress).toBe(100);
    expect(response.body.status).toBe('concluido');
    expect(await data.getRepository(Goal).count()).toBe(2);
  });
  it('supports status, hero and text filters without widening hero access', async () => {
    expect((await admin.get('/api/projects?status=concluido').expect(200)).body).toHaveLength(1);
    expect((await admin.get(`/api/projects?ownerId=${otherId}`).expect(200)).body).toHaveLength(0);
    expect((await hero.get(`/api/projects?ownerId=${otherId}`).expect(200)).body).toHaveLength(0);
    expect((await admin.get('/api/projects?search=teste').expect(200)).body).toHaveLength(1);
    await admin.get('/api/projects?status=invalido').expect(400);
  });
  it('resets goals when a mission is returned to pending', async () => {
    const response = await admin
      .patch(`/api/projects/${projectId}`)
      .send({ status: 'pendente' })
      .expect(200);
    expect(response.body.progress).toBe(0);
    expect(response.body.status).toBe('pendente');
    expect(await data.getRepository(Goal).count()).toBe(2);
  });
  it('protects the active admin and users who own projects', async () => {
    await admin.delete(`/api/users/${heroId}`).expect(409);
    await admin.delete(`/api/users/${adminId}`).expect(403);
    await admin.patch(`/api/users/${adminId}`).send({ role: 'hero' }).expect(403);
  });
  it('supports updating own profile and rejects invalid UUIDs', async () => {
    const response = await hero
      .patch('/api/users/me')
      .send({ name: 'Peter atualizado' })
      .expect(200);
    expect(response.body.name).toBe('Peter atualizado');
    await admin.get('/api/projects/not-a-uuid').expect(400);
  });
  it('reassigns projects and immediately updates visibility', async () => {
    await admin.patch(`/api/projects/${projectId}`).send({ ownerId: otherId }).expect(200);
    await hero.get(`/api/projects/${projectId}`).expect(404);
    await other.get(`/api/projects/${projectId}`).expect(200);
  });
  it('deletes projects with their goals and allows removing an unassigned hero', async () => {
    await admin.delete(`/api/projects/${projectId}`).expect(204);
    expect(await data.getRepository(Goal).count()).toBe(0);
    await admin.get(`/api/projects/${projectId}`).expect(404);
    await admin.delete(`/api/users/${heroId}`).expect(204);
  });
  it('clears the session on logout', async () => {
    await other.post('/api/auth/logout').expect(204);
    await other.get('/api/projects').expect(401);
  });
  it('publishes Swagger and a database-backed health endpoint', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
    const schema = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    expect(schema.body.paths).toHaveProperty('/api/projects');
  });
});
