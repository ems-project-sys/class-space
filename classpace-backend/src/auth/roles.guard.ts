import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    
    // Jeśli nie wymagamy specjalnej roli, przepuść
    if (!requiredRoles) {
      return true; 
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Wyciągane z JwtAuthGuard

    // Tylko użytkownik z wymaganą rolą (np. 'admin') może przejść
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Brak uprawnień. Tylko administrator może wykonać tę akcję.');
    }
    
    return true;
  }
}