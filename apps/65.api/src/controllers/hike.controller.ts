import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateHikeDto, HikeSearchDto, UpdateHikeDto } from 'src/DTO/hike.dto';
import { Hike } from 'src/entities/hike.entity';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { HikeService } from 'src/services/hike.service';

interface AuthenticatedRequest extends Request {
  user: { userId: string };
}

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

  @Get('favorites')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: "Récupérer les randonnées favorites d'un utilisateur",
  })
  @ApiResponse({
    status: 200,
    description: 'Randonnées favorites récupérées avec succès',
    type: [Hike],
  })
  async getHikeWithFavorites(
    @Req() req: AuthenticatedRequest,
  ): Promise<Hike[]> {
    const subId = req.user.userId;
    if (!subId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.hikeService.getHikeWithFavorites(subId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Récupérer une randonnée par son id' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée récupérée avec succès',
    type: Hike,
  })
  async getHikeById(@Param('id') id: string): Promise<Hike> {
    return this.hikeService.getHikeById(id);
  }

  @Post('toggle-favorite')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Ajouter ou supprimer une randonnée des favoris' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée ajoutée ou supprimée des favoris avec succès',
  })
  async toggleFavorite(
    @Body() body: { hikeId: string },
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const subId = req.user.userId;
    if (!subId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.hikeService.toggleFavorite(body.hikeId, subId);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Créer une randonnée' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée créée avec succès',
    type: Hike,
  })
  async createHike(@Body() hike: CreateHikeDto): Promise<Hike> {
    return this.hikeService.createHike(hike);
  }

  @Put('update')
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Mettre à jour une randonnée' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée mise à jour avec succès',
    type: Hike,
  })
  async updateHike(@Body() hike: UpdateHikeDto): Promise<Hike> {
    return this.hikeService.updateHike(hike);
  }
}
