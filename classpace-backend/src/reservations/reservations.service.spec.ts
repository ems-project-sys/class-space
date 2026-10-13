import { ConflictException, ForbiddenException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';

interface TransactionMock {
  room: {
    findUnique: jest.Mock<Promise<unknown>, [unknown]>;
  };
  issue: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  };
  reservation: {
    findFirst: jest.Mock<Promise<unknown>, [unknown]>;
    create: jest.Mock<Promise<unknown>, [unknown]>;
  };
}

interface ReservationPrismaMock {
  findUnique: jest.Mock<Promise<unknown>, [unknown]>;
  update: jest.Mock<Promise<unknown>, [unknown]>;
}

interface PrismaMock {
  $transaction: jest.Mock<
    Promise<unknown>,
    [
      (
        callback: (client: TransactionMock) => Promise<unknown>,
      ) => Promise<unknown>,
    ]
  >;
  reservation: ReservationPrismaMock;
}

const createPromiseMock = <T>() => jest.fn<Promise<T>, [unknown]>();

const createTransactionMock = () =>
  jest.fn<
    Promise<unknown>,
    [
      (
        callback: (client: TransactionMock) => Promise<unknown>,
      ) => Promise<unknown>,
    ]
  >();

describe('ReservationsService', () => {
  const transaction: TransactionMock = {
    room: {
      findUnique: createPromiseMock(),
    },
    issue: {
      findFirst: createPromiseMock(),
    },
    reservation: {
      findFirst: createPromiseMock(),
      create: createPromiseMock(),
    },
  };
  const prisma: PrismaMock = {
    $transaction: createTransactionMock(),
    reservation: {
      findUnique: createPromiseMock(),
      update: createPromiseMock(),
    },
  };
  const user = { sub: 'user-1', role: 'wykladowca' };
  let service: ReservationsService;

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(
      (callback: (client: TransactionMock) => Promise<unknown>) =>
        callback(transaction),
    );
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

    await expect(service.cancel('reservation-1', user)).resolves.toEqual({
      id: 'reservation-1',
      status: 'CANCELLED',
    });
    expect(prisma.reservation.update).toHaveBeenCalled();
  });

  it('rejects cancellation by another lecturer', async () => {
    prisma.reservation.findUnique.mockResolvedValue({
      id: 'reservation-1',
      userId: 'another-user',
      status: 'ACTIVE',
    });

    await expect(service.cancel('reservation-1', user)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
