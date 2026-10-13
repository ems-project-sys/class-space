import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type {
  AuthenticatedUser,
  CreateReservationInput,
} from './reservations.service';
import { ReservationsService } from './reservations.service';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

@Controller('api/reservations')
@UseGuards(JwtAuthGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  create(
    @Body() input: CreateReservationInput,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.reservationsService.create(input, request.user);
  }

  @Delete(':id')
  cancel(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.reservationsService.cancel(id, request.user);
  }
}
