import { Category } from "./category.model";
import { Difficulty } from "./difficulty.model";
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
