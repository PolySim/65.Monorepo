import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HikeSearchDto } from 'src/DTO/hike.dto';
import { Hike } from 'src/entities/hike.entity';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { HikeService } from 'src/services/hike.service';

@ApiTags('hikes')
@Controller('hikes')
export class HikeController {
  constructor(private readonly hikeService: HikeService) {}

  @Post('filters')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer toutes les randonnées avec filtres' })
  @ApiResponse({
    status: 200,
    description: 'Randonnées récupérées avec succès',
    type: [Hike],
  })
  async findAllWithFilters(@Body() filters: HikeSearchDto): Promise<Hike[]> {
    return this.hikeService.findAllWithFilters(filters);
  }
}
