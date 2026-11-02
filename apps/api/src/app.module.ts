import { Controller, Get, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { databaseOptions } from './database/config';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard, RolesGuard, Public } from './auth/access';
@Controller('health')
class HealthController {
  constructor(private readonly data: DataSource) {}
  @Public() @Get() async health() {
    await this.data.query('SELECT 1');
    return { status: 'ok', service: 'heroforce-api' };
  }
}
@Module({
  imports: [
    TypeOrmModule.forRoot(databaseOptions()),
    UsersModule,
    ProjectsModule,
    AuthModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
