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

export interface RoomSummary extends Room {
  isBooked: boolean;
  bookedBy: string;
  subject: string;
  time: string;
  issueId?: string;
  reservationId?: string;
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

  async getRoomSummaries(targetDate: string): Promise<RoomSummary[]> {
    const rooms = await this.prisma.room.findMany({
      include: {
        reservations: {
          where: {
            date: targetDate,
            status: 'ACTIVE',
          },
          include: {
            user: {
              select: { name: true },
            },
          },
          orderBy: { startTime: 'asc' },
          take: 1,
        },
        issues: {
          where: { status: 'OPEN' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { id: 'asc' },
    });

    return rooms.map((room) => {
      const reservation = room.reservations[0];
      const issue = room.issues[0];

      return {
        id: room.id,
        type: room.type,
        capacity: room.capacity,
        hasProjector: room.hasProjector,
        hasIssue: Boolean(issue),
        issueDesc: issue?.description || '',
        issueId: issue?.id,
        bookings: [],
        isBooked: Boolean(reservation),
        reservationId: reservation?.id,
        bookedBy: reservation?.user.name || '',
        subject: reservation?.subject || '',
        time: reservation
          ? `${reservation.startTime} - ${reservation.endTime}`
          : '',
      };
    });
  }
}
