import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { RoomsService, Room } from './rooms.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('api/rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @UseGuards(AuthGuard)
    @Get('available')
    getAvailableRooms(
        @Query('date') date: string,
        @Query('startTime') startTime: string,
        @Query('endTime') endTime: string,
    ): Room[] {
        if (!date || !startTime || !endTime) {
            return []; // Zabezpieczenie: puste zapytanie zwraca pustą listę
        }
        return this.roomsService.getAvailableRooms(date, startTime, endTime);
    }
}