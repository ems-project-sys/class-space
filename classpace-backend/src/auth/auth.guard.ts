import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor() {
        // Inicjalizacja Firebase Admin (odpala się tylko raz przy starcie serwera)
        if (!getApps().length) {
            admin.initializeApp({
                credential: cert(path.resolve(process.cwd(), 'firebase-adminsdk.json')),
            });
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // 1. Sprawdzamy, czy zapytanie ma w ogóle nagłówek "Authorization"
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Brak dostępu: Wymagany token JWT');
        }

        // 2. Wyciągamy sam token (ucinamy słowo "Bearer ")
        const token = authHeader.split(' ')[1];

        try {
            // 3. Odszyfrowanie i weryfikacja kryptograficzna
            const decodedToken = await getAuth().verifyIdToken(token);
            
            // 4. Sukces! Rejestrujemy dane użytkownika wewnątrz zapytania i wpuszczamy dalej
            request.user = decodedToken;
            return true; 
        } catch (error) {
            // Token wygasł, został sfałszowany lub klucz jest zły
            throw new UnauthorizedException('Brak dostępu: Nieprawidłowy lub wygasły token JWT');
        }
    }
}