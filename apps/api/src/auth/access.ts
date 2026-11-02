import {
  CanActivate,
  createParamDecorator,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from '../common/domain';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
export const Public = () => SetMetadata('public', true);
export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => ctx.switchToHttp().getRequest().user,
);
export type AuthenticatedRequest = Request & { user: User };
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}
  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride<boolean>('public', [ctx.getHandler(), ctx.getClass()]))
      return true;
    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = req.headers.authorization?.match(/^Bearer (.+)$/i)?.[1];
    const token = req.cookies?.heroforce_session ?? bearer;
    if (!token) throw new UnauthorizedException('Entre na sua conta para continuar.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, { algorithms: ['HS256'] });
      req.user = await this.users.find(payload.sub);
      return true;
    } catch {
      throw new UnauthorizedException('Sua sessão expirou. Entre novamente.');
    }
  }
}
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<Role[]>('roles', [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!roles?.length) return true;
    if (!roles.includes(ctx.switchToHttp().getRequest<AuthenticatedRequest>().user.role))
      throw new ForbiddenException('Esta ação é exclusiva de administradores.');
    return true;
  }
}
