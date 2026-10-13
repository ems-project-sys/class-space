import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

interface UserCreateData {
  name: string;
  email: string;
  passwordHash: string;
  role: string;
}

interface UserPrismaMock {
  findUnique: jest.Mock<Promise<UserRecord | null>, [unknown]>;
  create: jest.Mock<Promise<UserRecord>, [{ data: UserCreateData }]>;
}

describe('AuthService', () => {
  const prisma: { user: UserPrismaMock } = {
    user: {
      findUnique: jest.fn<Promise<UserRecord | null>, [unknown]>(),
      create: jest.fn<Promise<UserRecord>, [{ data: UserCreateData }]>(),
    },
  };
  const jwt = {
    sign: jest.fn().mockReturnValue('access-token'),
  };
  let service: AuthService;
  let createdUserData: UserCreateData;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(prisma as never, jwt as never);
    createdUserData = {
      name: '',
      email: '',
      passwordHash: '',
      role: '',
    };
  });

  it('registers a user with a hashed password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }) => {
      createdUserData = data;
      return Promise.resolve({
        id: 'user-1',
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
      });
    });

    const result = await service.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    expect(
      await bcrypt.compare('password123', createdUserData.passwordHash),
    ).toBe(true);
    expect(result).toEqual({
      accessToken: 'access-token',
      user: {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'wykladowca',
      },
    });
  });

  it('rejects registration for an existing email', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in with valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'wykladowca',
      passwordHash: await bcrypt.hash('password123', 4),
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.accessToken).toBe('access-token');
    expect(jwt.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'wykladowca',
    });
  });

  it('rejects invalid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
