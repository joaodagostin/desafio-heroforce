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
  Query,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '../auth/access';
import { Role } from '../common/domain';
import { User } from '../users/user.entity';
import { CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './project.dto';
import { ProjectsService } from './projects.service';
@ApiTags('Projetos')
@ApiCookieAuth('heroforce_session')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}
  @Get() list(@CurrentUser() actor: User, @Query() query: ProjectQueryDto) {
    return this.projects.list(actor, query);
  }
  @Get(':id') async get(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.projects.serialize(await this.projects.find(id, actor));
  }
  @Roles(Role.ADMIN) @Post() create(@Body() dto: CreateProjectDto, @CurrentUser() actor: User) {
    return this.projects.create(dto, actor);
  }
  @Roles(Role.ADMIN) @Patch(':id') update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() actor: User,
  ) {
    return this.projects.update(id, dto, actor);
  }
  @Roles(Role.ADMIN) @Delete(':id') @HttpCode(204) remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: User,
  ) {
    return this.projects.remove(id, actor);
  }
}
