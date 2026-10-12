import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface Booking {
    date: string;
    startTime: string;
    endTime: string;
    bookedBy: string;
}

export interface Room {
    id: string;
    type: string;
    capacity: number;
    hasProjector: boolean;
    hasIssue: boolean;
    issueDesc: string;
    bookings: Booking[];
}

@Injectable()
export class RoomsService {
    constructor(private readonly prisma: PrismaService) {}

    async getAvailableRooms(
        targetDate: string,
        targetStartTime: string,
        targetEndTime: string,
    ): Promise<Room[]> {
        const rooms = await this.prisma.room.findMany({
            where: {
                issues: {
                    none: {
                        status: 'OPEN',
                    },
                },
                reservations: {
                    none: {
                        date: targetDate,
                        status: 'ACTIVE',
                        startTime: { lt: targetEndTime },
                        endTime: { gt: targetStartTime },
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        return rooms.map((room) => ({
            id: room.id,
            type: room.type,
            capacity: room.capacity,
            hasProjector: room.hasProjector,
            hasIssue: false,
            issueDesc: '',
            bookings: [],
        }));
    }
}