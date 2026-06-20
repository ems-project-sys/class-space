import { Controller, Get } from '@nestjs/common';
import { RoomsService, Room } from './rooms.service';

@Controller('api/rooms')
export class RoomsController {
    constructor(private readonly roomsService: RoomsService) {}

    @Get()
    getAllRooms(): Room[] {
        return this.roomsService.findAll();
    }
}