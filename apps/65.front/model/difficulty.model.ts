export enum DifficultyEnum {
  PROMENEUR = "6392a48b-1faa-433f-8495-12b8333dde5e",
  MARCHEUR = "bbf70c09-1abc-4d39-b850-d5fd435fa1e5",
  RANDONNEUR = "b4daf10c-d5e9-47db-aaf2-ba3694704866",
  EXPERIMENTE = "fafe738f-1159-413a-87bb-55e90baeb850",
}

export type Difficulty = {
  id: DifficultyEnum;
  name: string;
};
