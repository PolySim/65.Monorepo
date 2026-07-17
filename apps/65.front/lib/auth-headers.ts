import { headers } from "next/headers";

export const getAuthHeaders = async (): Promise<{
  cookie: string;
} | null> => {
  const cookie = (await headers()).get("cookie");

  return cookie ? { cookie } : null;
};
