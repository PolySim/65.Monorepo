import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repository/user.repository';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findBySubId(id);
    if (!user) throw new NotFoundException(`Utilisateur non trouvé`);

    return user;
  }
}
