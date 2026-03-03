import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { Server } from 'socket.io';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

const GLOBAL_ROOM = 'room:global';

const ANIMALS = [
  '여우',
  '수달',
  '판다',
  '호랑이',
  '코알라',
  '매',
  '토끼',
  '돌고래',
  '펭귄',
  '늑대',
  '물개',
  '고슴도치',
  '참새',
  '레서판다',
  '사슴',
] as const;

const ADJECTIVES = [
  '용감한',
  '호기심많은',
  '다정한',
  '날쌘',
  '반짝이는',
  '고요한',
  '명랑한',
  '행운의',
  '똑똑한',
  '차분한',
  '기운찬',
  '따뜻한',
] as const;

type CursorUser = {
  clientId: string;
  name: string;
  color: string;
  x?: number;
  y?: number;
};

const users = new Map<string, CursorUser>();

function asObject(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  return payload as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function randomName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adjective}${animal}`;
}

function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  return `hsl(${hue} 78% 52%)`;
}

function initializeCursorSocket(httpServer: unknown) {
  const io = new Server(httpServer as never, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    void socket.join(GLOBAL_ROOM);

    users.forEach((user) => {
      socket.emit('cursor:join', user);
    });

    socket.on('cursor:join', (payload: unknown) => {
      const body = asObject(payload);
      const user: CursorUser = {
        clientId: socket.id,
        name: asString(body.name) ?? randomName(),
        color: asString(body.color) ?? randomColor(),
      };

      users.set(socket.id, user);
      io.to(GLOBAL_ROOM).emit('cursor:join', user);
    });

    socket.on('cursor:move', (payload: unknown) => {
      const current = users.get(socket.id);
      if (!current) {
        return;
      }

      const body = asObject(payload);
      const x = asFiniteNumber(body.x);
      const y = asFiniteNumber(body.y);

      if (x === null || y === null) {
        return;
      }

      users.set(socket.id, {
        ...current,
        x,
        y,
      });

      socket.to(GLOBAL_ROOM).emit('cursor:move', {
        clientId: current.clientId,
        name: current.name,
        color: current.color,
        x,
        y,
      });
    });

    const leave = () => {
      const current = users.get(socket.id);
      if (!current) {
        return;
      }

      users.delete(socket.id);
      socket
        .to(GLOBAL_ROOM)
        .emit('cursor:leave', { clientId: current.clientId });
    };

    socket.on('cursor:leave', leave);
    socket.on('disconnect', leave);
  });

  return io;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(app.get(TransformInterceptor));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('APPlY API')
    .setDescription('API documentation for APPlY server')
    .setVersion('1.0')
    .addServer('http://localhost:3000', 'Local')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
        name: 'Authorization',
        description: 'Bearer access token',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  initializeCursorSocket(app.getHttpServer());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
