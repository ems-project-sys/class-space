import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  async analyzePrompt(prompt: string) {
    const lower = prompt.toLowerCase();
    
    const requiresProjector = lower.includes('rzutnik') || lower.includes('projektor');
    
    // Zmiana: informujemy TypeScript, że zmienna może być tekstem lub nullem
    let roomType: string | null = null; 
    
    if (lower.includes('wykład')) roomType = 'Wykładowa';
    else if (lower.includes('komputer') || lower.includes('lab')) roomType = 'Lab. Komputerowe';
    else if (lower.includes('ćwicz') || lower.includes('cwicz')) roomType = 'Ćwiczeniowa';
    else if (lower.includes('aul')) roomType = 'Aula';

    const numbers = lower.match(/\d+/);
    const requiredCapacity = numbers ? parseInt(numbers[0], 10) : null;

    return {
      success: true,
      filters: {
        needsProjector: requiresProjector,
        type: roomType,
        capacity: requiredCapacity
      },
      message: 'Parametry zdekodowane pomyślnie'
    };
  }
}