import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as path from 'path';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor() {
        // Initialize Firebase Admin (runs only once on server startup)
        if (!getApps().length) {
            admin.initializeApp({
                credential: cert(path.resolve(process.cwd(), 'firebase-adminsdk.json')),
            });
        }
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        // 1. Check if the request has an "Authorization" header at all
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Access denied: JWT token required');
        }

        // 2. Extract the token itself (cut off the word "Bearer ")
        const token = authHeader.split(' ')[1];

        try {
            // 3. Cryptographic decryption and verification
            const decodedToken = await getAuth().verifyIdToken(token);
            
            // 4. Success! We register user data inside the request and allow it to proceed
            request.user = decodedToken;
            return true; 
        } catch (error) {
            // Token expired, was forged or the key is invalid
            throw new UnauthorizedException('Access denied: Invalid or expired JWT token');
        }
    }
}