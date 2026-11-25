import { ApiProperty } from '@nestjs/swagger';

export const HIKE_SUGGESTION_MAX_LENGTH = 80;

export class HikeSearchDto {
  title?: string;
  categoryId?: string;
  stateId?: string;
}

export class HikeSuggestionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  categoryName: string;

  @ApiProperty()
  stateId: string;

  @ApiProperty()
  stateName: string;
}

export class HikeFavoriteStatusDto {
  @ApiProperty()
  isFavorite: boolean;
}

export class CreateHikeDto {
  title: string;
  stateId: string;
  difficultyId: string;
  categoryId: string;
}

export class UpdateHikeDto {
  id: string;
  title?: string;
  stateId?: string;
  difficultyId?: string;
  categoryId?: string;
  content?: string;
  indication?: string;
  distance?: number;
  duration?: string;
  elevation?: number;
  mainImageId?: string;
  mainImagePosition?: number;
}
