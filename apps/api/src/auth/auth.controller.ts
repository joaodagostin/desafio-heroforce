import { Body, Controller, Get, HttpCode, Post, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { CurrentUser, Public } from './access';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from '../users/user.dto';
import { User, publicUser } from '../users/user.entity';
const cookieOptions = () => ({
  httpOnly: true,
  secure: process.env.COOKIE_SECURE === 'true',
  sameSite: 'lax' as const,
  path: '/api',
  maxAge: 8 * 60 * 60 * 1000,
});
@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Public()
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Registra um herói; nunca permite criar administradores' })
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.register(dto);
    res.cookie('heroforce_session', result.token, cookieOptions());
    return result.user;
  }
  @Public()
  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.login(dto);
    res.cookie('heroforce_session', result.token, cookieOptions());
    return result.user;
  }
  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('heroforce_session', { ...cookieOptions(), maxAge: undefined });
  }
  @Get('me')
  @ApiCookieAuth('heroforce_session')
  me(@CurrentUser() user: User) {
    return publicUser(user);
  }
}
