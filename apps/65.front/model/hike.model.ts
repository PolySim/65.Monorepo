import { Category } from "./category.model";
import { Difficulty } from "./difficulty.model";
import { GPX } from "./gpx.model";
import { Image } from "./image.model";
import { State } from "./state.model";

export type HikeFilter = {
  title?: string;
  categoryId?: string;
  stateId?: string;
};

export type HikeSearch = {
  id: string;
  title: string;
  category: Category;
  state: State;
  mainImage: Image;
  difficulty: Difficulty;
  distance?: number;
  duration?: string;
  elevation?: number;
};

export type Hike = {
  id: string;
  title: string;
  content: string;
  indication: string;
  difficulty: Difficulty;
  distance?: number;
  duration?: string;
  elevation?: number;
  mainImage: Image;
  mainImagePosition: number;
  images: Image[];
  category: Category;
  state: State;
  gpxFiles: [GPX] | [];
};

export type CreateHikeDto = {
  title: string;
  difficultyId: string;
  stateId: string;
  categoryId: string;
};

export type UpdateHikeDto = {
  id: string;
  title?: string;
  content?: string;
  indication?: string;
  distance?: number;
  duration?: string;
  elevation?: number;
  mainImageId?: string;
  mainImagePosition?: number;
  difficultyId?: string;
  stateId?: string;
  categoryId?: string;
};
