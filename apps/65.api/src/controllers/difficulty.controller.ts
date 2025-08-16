import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Difficulty } from 'src/entities/difficulty.entity';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { DifficultyService } from '../services/difficulty.service';

@ApiTags('difficulties')
@Controller('difficulties')
export class DifficultyController {
  constructor(private readonly difficultyService: DifficultyService) {}

  @Get()
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer toutes les difficultés' })
  @ApiResponse({
    status: 200,
    description: 'Difficultés récupérées avec succès',
    type: [Difficulty],
  })
  async findAll(): Promise<Difficulty[]> {
    return this.difficultyService.findAll();
  }
}
