import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);
  private isFirebaseInitialized = false;

  constructor() {
    const serviceAccountPath = path.resolve(process.cwd(), 'firebase-adminsdk.json');
    
    // Zabezpieczenie: Inicjujemy Firebase tylko, gdy plik istnieje i aplikacja nie została jeszcze zainicjowana
    if (fs.existsSync(serviceAccountPath)) {
      try {
        if (getApps().length === 0) {
          initializeApp({
            credential: cert(serviceAccountPath),
          });
        }
        this.isFirebaseInitialized = true;
        this.logger.log('Firebase zainicjalizowany poprawnie.');
      } catch (error) {
        this.logger.error('Błąd inicjalizacji kluczy Firebase:', error);
      }
    } else {
      this.logger.warn('Brak pliku firebase-adminsdk.json! Uruchamiam Guard w trybie deweloperskim (Mock).');
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Tryb deweloperski - bezpieczne ominięcie weryfikacji JWT na czas testów
    if (!this.isFirebaseInitialized) {
      request.user = { role: 'admin', uid: 'dev-mode-user' };
      return true; 
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      this.logger.error('Błąd weryfikacji tokenu JWT', error);
      return false;
    }
  }
}