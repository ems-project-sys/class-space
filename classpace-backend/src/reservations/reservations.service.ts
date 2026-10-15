import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma.service';

export interface CreateReservationInput {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
}

export interface AuthenticatedUser {
  sub: string;
  role: string;
}

@Injectable()
export class ReservationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(userId: string) {
    return this.prisma.reservation.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        room: {
          select: {
            id: true,
            type: true,
            capacity: true,
            hasProjector: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  }

  async create(input: CreateReservationInput, user: AuthenticatedUser) {
    this.validateTimeRange(input.startTime, input.endTime);

    return this.prisma.$transaction(
      async (transaction) => {
        const room = await transaction.room.findUnique({
          where: { id: input.roomId },
        });

        if (!room) {
          throw new NotFoundException('Room not found.');
        }

        const openIssue = await transaction.issue.findFirst({
          where: {
            roomId: input.roomId,
            status: 'OPEN',
          },
        });

        if (openIssue) {
          throw new ConflictException('Room has an open issue.');
        }

        const conflictingReservation = await transaction.reservation.findFirst({
          where: {
            roomId: input.roomId,
            date: input.date,
            status: 'ACTIVE',
            startTime: { lt: input.endTime },
            endTime: { gt: input.startTime },
          },
        });

        if (conflictingReservation) {
          throw new ConflictException(
            'Room is already reserved for this time.',
          );
        }

        return transaction.reservation.create({
          data: {
            roomId: input.roomId,
            userId: user.sub,
            date: input.date,
            startTime: input.startTime,
            endTime: input.endTime,
            subject: input.subject,
          },
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new NotFoundException('Reservation not found.');
    }

    const canCancelAnyReservation = ['admin', 'portiernia'].includes(user.role);
    if (!canCancelAnyReservation && reservation.userId !== user.sub) {
      throw new ForbiddenException('You cannot cancel this reservation.');
    }

    if (reservation.status !== 'ACTIVE') {
      throw new ConflictException('Reservation is not active.');
    }

    return this.prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new BadRequestException('Time must use the HH:mm format.');
    }

    if (startTime >= endTime) {
      throw new BadRequestException('End time must be later than start time.');
    }
  }
}
