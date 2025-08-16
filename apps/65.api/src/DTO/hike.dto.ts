export class HikeSearchDto {
  title?: string;
  categoryId?: string;
  stateId?: string;
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
