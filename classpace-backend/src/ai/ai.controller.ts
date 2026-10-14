import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';

interface ParsePromptBody {
  prompt: string;
}

@Controller('api/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse')
  parseQuery(@Body() body: ParsePromptBody) {
    return this.aiService.analyzePrompt(body.prompt);
  }
}
