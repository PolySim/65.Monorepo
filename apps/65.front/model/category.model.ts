import { State } from "./state.model";

export type Category = {
  id: string;
  name: string;
  image_path: string;
  states: State[];
};
