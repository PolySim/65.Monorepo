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
