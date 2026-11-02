import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../auth/access';
import { Role } from '../common/domain';
import { User } from './user.entity';
import { CreateUserDto, UpdateProfileDto, UpdateUserDto } from './user.dto';
import { UsersService } from './users.service';
@ApiTags('Heróis')
@ApiCookieAuth('heroforce_session')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Patch('me') updateMe(@CurrentUser() actor: User, @Body() dto: UpdateProfileDto) {
    return this.users.update(actor.id, dto, actor.id);
  }
  @Roles(Role.ADMIN) @Get() list() {
    return this.users.list();
  }
  @Roles(Role.ADMIN) @Post() create(@Body() dto: CreateUserDto) {
    return this.users.create(dto, true);
  }
  @Roles(Role.ADMIN) @Get(':id') get(@Param('id', ParseUUIDPipe) id: string) {
    return this.users.find(id);
  }
  @Roles(Role.ADMIN) @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() actor: User,
  ) {
    return this.users.update(id, dto, actor.id);
  }
  @Roles(Role.ADMIN) @Delete(':id') @HttpCode(204) remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    return this.users.remove(id, actor.id);
  }
}
