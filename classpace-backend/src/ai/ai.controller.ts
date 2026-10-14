import { Controller, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('parse')
  async parseQuery(@Body('prompt') prompt: string) {
    return this.aiService.analyzePrompt(prompt);
  }
}