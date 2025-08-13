import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { User } from '../entities/user.entity';
import { UserService } from '../services/user.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer un utilisateur par ID' })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur récupéré avec succès',
    type: User,
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
  })
  async findById(@Req() req: AuthenticatedRequest): Promise<User> {
    return this.userService.findById(req.user.userId);
  }
}
