import { AppDataSource } from './config';
import { seedDatabase } from './seed-data';
async function main() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('O seed demonstrativo está desabilitado em produção.');
  await AppDataSource.initialize();
  try {
    await seedDatabase(AppDataSource);
    console.log('Seed concluído. Bases com usuários existentes são preservadas.');
  } finally {
    await AppDataSource.destroy();
  }
}
main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
