import { Controller, Get, Query } from '@nestjs/common';
import { RoomsService, Room } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Get('available')
    getAvailableRooms(
        @Query('date') date: string,
        @Query('startTime') startTime: string,
        @Query('endTime') endTime: string,
    ): Promise<Room[]> {
        if (!date || !startTime || !endTime) {
            return Promise.resolve([]);
        }
        return this.roomsService.getAvailableRooms(date, startTime, endTime);
    }
}