import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { IssuesModule } from './issues/issues.module';
import { PrismaModule } from './prisma.module';
import { ReservationsModule } from './reservations/reservations.module';
import { RoomsModule } from './rooms/rooms.module';
import { HealthController } from './health.controller';

const validateConfig = (config: Record<string, unknown>) => {
  for (const key of ['DATABASE_URL', 'JWT_SECRET']) {
    if (typeof config[key] !== 'string' || config[key] === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return {
    ...config,
    FRONTEND_URL: config.FRONTEND_URL || 'http://localhost:5173',
    PORT: Number(config.PORT || 3000),
  };
};

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
    }),
    AiModule,
    AuthModule,
    IssuesModule,
    PrismaModule,
    ReservationsModule,
    RoomsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
