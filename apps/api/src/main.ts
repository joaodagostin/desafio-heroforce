import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from './app.module';
import { configureApp } from './common/configure-app';
import { seedDatabase } from './database/seed-data';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  app.enableShutdownHooks();
  if (process.env.SEED_DEMO === 'true') {
    if (process.env.NODE_ENV === 'production')
      throw new Error('SEED_DEMO não pode ser ativado em produção.');
    await seedDatabase(app.get(DataSource));
  }
  await app.listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
}
bootstrap().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
