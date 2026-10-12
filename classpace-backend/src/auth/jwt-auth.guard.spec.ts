import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const jwt = {
    verify: jest.fn(),
  };
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new JwtAuthGuard(jwt as never);
  });

  const createContext = (authorization?: string) => {
    const request = {
      headers: authorization ? { authorization } : {},
    };
    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;

    return { context, request };
  };

  it('rejects a request without a bearer token', () => {
    const { context } = createContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('attaches the verified token payload to the request', () => {
    const payload = { sub: 'user-1', role: 'wykladowca' };
    jwt.verify.mockReturnValue(payload);
    const { context, request } = createContext('Bearer valid-token');

    expect(guard.canActivate(context)).toBe(true);
    expect(request.user).toEqual(payload);
    expect(jwt.verify).toHaveBeenCalledWith('valid-token');
  });

  it('rejects an invalid token', () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    const { context } = createContext('Bearer invalid-token');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
