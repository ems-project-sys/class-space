import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma.service';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  let service: RoomsService;
  const prisma = {
    room: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    prisma.room.findMany.mockResolvedValue([
      {
        id: '101',
        type: 'Sala Ćwiczeniowa',
        capacity: 30,
        hasProjector: true,
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<RoomsService>(RoomsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Room Availability Query', () => {
    it('returns rooms mapped from Prisma', async () => {
      const availableRooms = await service.getAvailableRooms(
        '2026-06-19',
        '15:00',
        '17:00',
      );

      expect(availableRooms).toEqual([
        {
          id: '101',
          type: 'Sala Ćwiczeniowa',
          capacity: 30,
          hasProjector: true,
          hasIssue: false,
          issueDesc: '',
          bookings: [],
        },
      ]);
      expect(prisma.room.findMany).toHaveBeenCalledWith({
        where: {
          issues: { none: { status: 'OPEN' } },
          reservations: {
            none: {
              date: '2026-06-19',
              status: 'ACTIVE',
              startTime: { lt: '17:00' },
              endTime: { gt: '15:00' },
            },
          },
        },
        orderBy: { id: 'asc' },
      });
    });
  });
});
