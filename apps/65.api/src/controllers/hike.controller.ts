import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  CreateHikeDto,
  HIKE_SUGGESTION_MAX_LENGTH,
  HikeFavoriteStatusDto,
  HikeSearchDto,
  HikeSuggestionDto,
  UpdateHikeDto,
} from 'src/DTO/hike.dto';
import { Hike } from 'src/entities/hike.entity';
import { AdminGuard } from 'src/middleware/AdminGuard';
import { AuthGuard } from 'src/middleware/AuthGuard';
import { HikeService } from 'src/services/hike.service';
import { AuthenticatedRequest } from 'src/types/authenticated-request';

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
    const authUserId = req.user.id;
    if (!authUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.hikeService.getHikeWithFavorites(authUserId);
  }

  @Get('suggestions')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Suggérer au plus huit randonnées' })
  @ApiQuery({
    name: 'q',
    schema: { type: 'string', maxLength: HIKE_SUGGESTION_MAX_LENGTH },
  })
  @ApiResponse({ status: 200, type: [HikeSuggestionDto] })
  async findSuggestions(
    @Query('q') query: unknown,
  ): Promise<HikeSuggestionDto[]> {
    return this.hikeService.findSuggestions(query);
  }

  @Get(':id/favorite')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Lire le statut favori de la randonnée' })
  @ApiResponse({ status: 200, type: HikeFavoriteStatusDto })
  async getFavoriteStatus(
    @Param('id') hikeId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<HikeFavoriteStatusDto> {
    return this.hikeService.getFavoriteStatus(hikeId, req.user.id);
  }

  @Put(':id/favorite')
  @UseGuards(AuthGuard)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Fixer le statut favori de la randonnée' })
  @ApiBody({ type: HikeFavoriteStatusDto })
  @ApiResponse({ status: 200, type: HikeFavoriteStatusDto })
  async setFavorite(
    @Param('id') hikeId: string,
    @Body('isFavorite') isFavorite: unknown,
    @Req() req: AuthenticatedRequest,
  ): Promise<HikeFavoriteStatusDto> {
    if (typeof isFavorite !== 'boolean') {
      throw new BadRequestException('isFavorite doit être un booléen');
    }
    return this.hikeService.setFavorite(hikeId, req.user.id, isFavorite);
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
    const authUserId = req.user.id;
    if (!authUserId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.hikeService.toggleFavorite(body.hikeId, authUserId);
  }

  @Post('create')
  @UseGuards(AuthGuard, AdminGuard)
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
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Mettre à jour une randonnée' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée mise à jour avec succès',
    type: Hike,
  })
  async updateHike(@Body() hike: UpdateHikeDto): Promise<Hike> {
    return this.hikeService.updateHike(hike);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, AdminGuard)
  @ApiOperation({ summary: 'Supprimer une randonnée' })
  @ApiResponse({
    status: 200,
    description: 'Randonnée supprimée avec succès',
  })
  async deleteHike(@Param('id') id: string): Promise<void> {
    return this.hikeService.deleteHike(id);
  }
}
