import { Category } from "./category.model";
import { State } from "./state.model";

export type HikeFilter = {
  title: string;
};

export type HikeSearch = {
  id: string;
  title: string;
  category: Category;
  state: State;
};
