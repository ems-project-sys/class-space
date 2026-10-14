import { BadRequestException, Injectable } from '@nestjs/common';

export interface RoomAssistantFilters {
  needsProjector: boolean;
  type: string | null;
  capacity: number | null;
}

@Injectable()
export class AiService {
  analyzePrompt(prompt: string): {
    success: true;
    filters: RoomAssistantFilters;
    message: string;
  } {
    if (!prompt?.trim()) {
      throw new BadRequestException('Prompt is required.');
    }

    const lowerPrompt = prompt.toLocaleLowerCase('pl-PL');
    const requiredCapacity = lowerPrompt.match(/\d+/);
    let roomType: string | null = null;

    if (lowerPrompt.includes('wykład') || lowerPrompt.includes('wyklad')) {
      roomType = 'Wykładowa';
    } else if (
      lowerPrompt.includes('komputer') ||
      lowerPrompt.includes('lab')
    ) {
      roomType = 'Lab. Komputerowe';
    } else if (
      lowerPrompt.includes('ćwicz') ||
      lowerPrompt.includes('cwicz')
    ) {
      roomType = 'Ćwiczeniowa';
    } else if (lowerPrompt.includes('aul')) {
      roomType = 'Aula';
    }

    return {
      success: true,
      filters: {
        needsProjector:
          lowerPrompt.includes('rzutnik') ||
          lowerPrompt.includes('projektor'),
        type: roomType,
        capacity: requiredCapacity
          ? Number.parseInt(requiredCapacity[0], 10)
          : null,
      },
      message: 'Parametry zdekodowane pomyślnie',
    };
  }
}
