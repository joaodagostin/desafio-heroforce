import 'reflect-metadata';
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';
import { User } from '../users/user.entity';
import { Goal, Project } from '../projects/project.entity';
import { InitialSchema1793577600000 } from './migration';
config({
  path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
  quiet: true,
});
export const databaseOptions = (): PostgresConnectionOptions => ({
  type: 'postgres',
  url:
    process.env.DATABASE_URL ??
    'postgresql://heroforce:local-heroforce-only@localhost:5432/heroforce',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
  entities: [User, Project, Goal],
  migrations: [InitialSchema1793577600000],
  migrationsRun: true,
  synchronize: false,
  uuidExtension: 'pgcrypto',
  logging: false,
});
export const AppDataSource = new DataSource(databaseOptions());
