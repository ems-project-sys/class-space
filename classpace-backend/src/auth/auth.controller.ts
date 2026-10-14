import { Controller, Post, Body, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthGuard } from './auth.guard'; 
import { RolesGuard } from './roles.guard';

@Controller('auth')
export class AuthController {
  
  @Post('register')
  async register(@Body() userData: any) {
    return { message: 'Zarejestrowano użytkownika' };
  }

  @UseGuards(AuthGuard, RolesGuard)
  @SetMetadata('roles', ['admin'])
  @Post('register-admin')
  async registerAdmin(@Body() adminData: any) {
    return { message: 'Nowe konto administratora zostało bezpiecznie utworzone.' };
  }
}