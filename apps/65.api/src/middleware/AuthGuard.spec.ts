import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { auth } from '../auth';
import { AuthGuard } from './AuthGuard';

jest.mock('../auth', () => ({
  auth: {
    api: {
      getSession: jest.fn(),
    },
  },
}));

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: jest.fn(() => new Headers()),
}));

const createContext = (request: Record<string, unknown>): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

describe('AuthGuard', () => {
  const guard = new AuthGuard();
  const getSession = auth.api.getSession as unknown as jest.Mock;

  beforeEach(() => {
    getSession.mockReset();
  });

  it('attache la session Better Auth à la requête', async () => {
    const request = { headers: { cookie: 'better-auth.session_token=test' } };
    const user = { id: 'auth-user-id', email: 'user@example.com' };
    const session = { id: 'session-id', userId: user.id };
    getSession.mockResolvedValue({ user, session });

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request).toMatchObject({ user, session });
  });

  it('refuse une requête sans session valide', async () => {
    getSession.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext({ headers: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
