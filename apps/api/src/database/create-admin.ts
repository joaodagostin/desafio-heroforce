import { validateOrReject } from 'class-validator';
import { AppDataSource } from './config';
import { Role } from '../common/domain';
import { CreateUserDto } from '../users/user.dto';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
async function main() {
  const input = Object.assign(new CreateUserDto(), {
    name: process.env.ADMIN_NAME ?? 'Administrador HeroForce',
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase(),
    password: process.env.ADMIN_PASSWORD,
    character: process.env.ADMIN_CHARACTER ?? 'Homem de Ferro',
    role: Role.ADMIN,
  });
  if (!input.password || input.password.length < 12)
    throw new Error('Defina ADMIN_PASSWORD com pelo menos 12 caracteres.');
  await validateOrReject(input, { whitelist: true, forbidNonWhitelisted: true });
  await AppDataSource.initialize();
  try {
    const user = await new UsersService(AppDataSource.getRepository(User)).create(input, true);
    console.log(`Administrador criado: ${user.email} (${user.id})`);
  } finally {
    await AppDataSource.destroy();
  }
}
main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : 'Dados inválidos. Verifique ADMIN_EMAIL, ADMIN_NAME, ADMIN_CHARACTER e ADMIN_PASSWORD.',
  );
  process.exit(1);
});
