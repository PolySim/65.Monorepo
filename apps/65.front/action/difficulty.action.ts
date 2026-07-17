"use server";

import { config } from "@/config/config";
import { getAuthHeaders } from "@/lib/auth-headers";
import { Difficulty } from "@/model/difficulty.model";

export const getDifficulties = async () => {
  try {
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      console.error("Unauthorized for fetching difficulties");
      return { success: false };
    }
    const res = await fetch(`${config.API_URL}/difficulties`, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      cache: "force-cache",
      next: {
        tags: ["difficulties"],
      },
    });

    if (!res.ok) {
      console.error("Error in fetching difficulties", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as Difficulty[];
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
};
