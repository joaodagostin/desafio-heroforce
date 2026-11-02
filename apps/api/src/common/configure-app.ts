import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
export function configureApp(app: INestApplication) {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173,http://localhost:8080')
      .split(',')
      .map((s) => s.trim()),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      validationError: { target: false, value: false },
    }),
  );
  const config = new DocumentBuilder()
    .setTitle('HeroForce API')
    .setDescription(
      'Gestão de projetos heroicos. Autentique em /api/auth/login; o Swagger envia o cookie HttpOnly da sessão. Cadastros públicos têm papel hero.',
    )
    .setVersion('1.0.0')
    .addCookieAuth('heroforce_session')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config), {
    swaggerOptions: { withCredentials: true },
    jsonDocumentUrl: 'api/docs-json',
  });
}
