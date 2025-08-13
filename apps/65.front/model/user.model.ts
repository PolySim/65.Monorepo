export type User = {
  id: string;
  email: string;
  subId: string;
  roleId: UserRole;
};

export enum UserRole {
  USER = 0,
  ADMIN = 1,
}
