import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AiController } from './ai/ai.controller'; // <--- Import
import { AiService } from './ai/ai.service';       // <--- Import

@Module({
  imports: [],
  controllers: [AppController, AuthController, AiController], // <--- Dodaj AiController
  providers: [AppService, AiService],                         // <--- Dodaj AiService
})
export class AppModule {}