import { MigrationInterface, QueryRunner } from 'typeorm';
export class InitialSchema1793577600000 implements MigrationInterface {
  name = 'InitialSchema1793577600000';
  async up(q: QueryRunner) {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await q.query(
      `CREATE TABLE "users" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(100) NOT NULL, "email" varchar(180) UNIQUE NOT NULL, "character" varchar(60) NOT NULL, "passwordHash" varchar NOT NULL, "role" varchar NOT NULL DEFAULT 'hero' CHECK ("role" IN ('hero','admin')), "createdAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(
      `CREATE TABLE "projects" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "name" varchar(120) NOT NULL, "description" text NOT NULL, "status" varchar NOT NULL DEFAULT 'pendente' CHECK ("status" IN ('pendente','em_andamento','concluido')), "ownerId" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT, "dueDate" date, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now())`,
    );
    await q.query(`CREATE INDEX "IDX_projects_owner_status" ON "projects" ("ownerId", "status")`);
    await q.query(
      `CREATE TABLE "goals" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "value" varchar NOT NULL CHECK ("value" IN ('agilidade','encantamento','eficiencia','excelencia','transparencia','ambicao')), "description" varchar(200) NOT NULL, "completed" boolean NOT NULL DEFAULT false, "projectId" uuid REFERENCES "projects"("id") ON DELETE CASCADE NOT NULL)`,
    );
    await q.query(`CREATE INDEX "IDX_goals_project" ON "goals" ("projectId")`);
  }
  async down(q: QueryRunner) {
    await q.query('DROP TABLE "goals"');
    await q.query('DROP TABLE "projects"');
    await q.query('DROP TABLE "users"');
  }
}
