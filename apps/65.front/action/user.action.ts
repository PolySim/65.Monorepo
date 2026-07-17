"use server";

import { config } from "@/config/config";
import { getAuthHeaders } from "@/lib/auth-headers";
import { User } from "@/model/user.model";

export const getUser = async () => {
  try {
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      console.error("Unauthorized for fetching user");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/users`, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error in fetching user", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as User;
    return { success: true, data };
  } catch (error) {
    console.error("Error in fetching user", error);
    return { success: false };
  }
};
