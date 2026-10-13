import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Room, RoomSummary, RoomsService } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getRoomSummaries(@Query('date') date?: string): Promise<RoomSummary[]> {
    const targetDate = date || new Date().toISOString().slice(0, 10);
    return this.roomsService.getRoomSummaries(targetDate);
  }

  @UseGuards(JwtAuthGuard)
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
