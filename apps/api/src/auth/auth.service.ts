import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { publicUser } from '../users/user.entity';
import { LoginDto, RegisterDto } from '../users/user.dto';
// Same bcrypt cost as real accounts so nonexistent emails also perform a comparison.
const DUMMY_HASH = '$2b$12$gM6obV7gBErMbRxIUuW1UO4oRLSDBvhQmQ4l7OuYRr4dY7QG4Pu3q';
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}
  async login(input: LoginDto) {
    const user = await this.users.credentials(input.email);
    const valid = await compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !valid) throw new UnauthorizedException('E-mail ou senha incorretos.');
    return this.session(publicUser(user));
  }
  async register(input: RegisterDto) {
    return this.session(await this.users.create(input));
  }
  private async session(user: ReturnType<typeof publicUser>) {
    return { user, token: await this.jwt.signAsync({ sub: user.id }) };
  }
}
