import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repository/user.repository';
import { AdminGuard } from './AdminGuard';

const createContext = (authUserId: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: { id: authUserId } }),
    }),
  }) as ExecutionContext;

describe('AdminGuard', () => {
  const findByAuthUserId = jest.fn();
  const repository = { findByAuthUserId } as unknown as UserRepository;
  const guard = new AdminGuard(repository);

  beforeEach(() => {
    findByAuthUserId.mockReset();
  });

  it("autorise un utilisateur métier avec le rôle d'administrateur", async () => {
    findByAuthUserId.mockResolvedValue({ roleId: 1 } as User);

    await expect(
      guard.canActivate(createContext('auth-admin-id')),
    ).resolves.toBe(true);
    expect(findByAuthUserId).toHaveBeenCalledWith('auth-admin-id');
  });

  it('refuse un utilisateur métier sans le rôle administrateur', async () => {
    findByAuthUserId.mockResolvedValue({ roleId: 0 } as User);

    await expect(
      guard.canActivate(createContext('auth-user-id')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('refuse un utilisateur Better Auth sans utilisateur métier associé', async () => {
    findByAuthUserId.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext('unknown-auth-user-id')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
