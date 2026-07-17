import { NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repository/user.repository';
import { UserService } from './user.service';

describe('UserService', () => {
  const findByAuthUserId = jest.fn();
  const repository = { findByAuthUserId } as unknown as UserRepository;
  const service = new UserService(repository);

  beforeEach(() => {
    findByAuthUserId.mockReset();
  });

  it("résout l'utilisateur métier depuis l'identifiant Better Auth", async () => {
    const user = {
      id: 'application-user-id',
      authUserId: 'auth-user-id',
    } as User;
    findByAuthUserId.mockResolvedValue(user);

    await expect(service.findById('auth-user-id')).resolves.toBe(user);
    expect(findByAuthUserId).toHaveBeenCalledWith('auth-user-id');
  });

  it('signale un utilisateur Better Auth non relié', async () => {
    findByAuthUserId.mockResolvedValue(null);

    await expect(service.findById('unknown')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
