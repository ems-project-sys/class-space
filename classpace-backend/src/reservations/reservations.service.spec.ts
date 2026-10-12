import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const transaction = {
    room: {
      findUnique: jest.fn(),
    },
    issue: {
      findFirst: jest.fn(),
    },
    reservation: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  };
  const prisma = {
    $transaction: jest.fn(),
    reservation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const user = { sub: 'user-1', role: 'wykladowca' };
  let service: ReservationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (callback) => callback(transaction));
    transaction.room.findUnique.mockResolvedValue({ id: '101' });
    transaction.issue.findFirst.mockResolvedValue(null);
    transaction.reservation.findFirst.mockResolvedValue(null);
    transaction.reservation.create.mockResolvedValue({ id: 'reservation-1' });
    service = new ReservationsService(prisma as never);
  });

  it('creates a reservation when the room is available', async () => {
    const result = await service.create(
      {
        roomId: '101',
        date: '2026-10-12',
        startTime: '10:00',
        endTime: '11:30',
        subject: 'Algorithms',
      },
      user,
    );

    expect(result).toEqual({ id: 'reservation-1' });
    expect(transaction.reservation.create).toHaveBeenCalledWith({
      data: {
        roomId: '101',
        userId: 'user-1',
        date: '2026-10-12',
        startTime: '10:00',
        endTime: '11:30',
        subject: 'Algorithms',
      },
    });
  });

  it('rejects a reservation that overlaps an active reservation', async () => {
    transaction.reservation.findFirst.mockResolvedValue({ id: 'existing' });

    await expect(
      service.create(
        {
          roomId: '101',
          date: '2026-10-12',
          startTime: '11:00',
          endTime: '12:00',
          subject: 'Algorithms',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('rejects a reservation for a room with an open issue', async () => {
    transaction.issue.findFirst.mockResolvedValue({ id: 'issue-1' });

    await expect(
      service.create(
        {
          roomId: '101',
          date: '2026-10-12',
          startTime: '10:00',
          endTime: '11:30',
          subject: 'Algorithms',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows the reservation owner to cancel an active reservation', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      userId: 'user-1',
      status: 'ACTIVE',
    });
    prisma.reservation.update.mockResolvedValue({
      id: 'reservation-1',
      status: 'CANCELLED',
    });

    const result = await service.cancel('reservation-1', user);

    expect(result).toEqual({ id: 'reservation-1', status: 'CANCELLED' });
    expect(prisma.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: expect.objectContaining({ status: 'CANCELLED' }),
    });
  });

  it('rejects cancellation by another lecturer', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      userId: 'another-user',
      status: 'ACTIVE',
    });

    await expect(
      service.cancel('reservation-1', user),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
