"use server";

import { config } from "@/config/config";
import { getAuthHeaders } from "@/lib/auth-headers";
import { Category } from "@/model/category.model";

export const getCategories = async () => {
  try {
    const authHeaders = await getAuthHeaders();

    if (!authHeaders) {
      console.error("Unauthorized for fetching categories");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/categories`, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
      cache: "force-cache",
      next: {
        tags: ["categories"],
      },
    });

    if (!res.ok) {
      console.error("Error in fetching categories", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as Category[];
    return { success: true, data };
  } catch (error) {
    console.error("Error in fetching categories", error);
    return { success: false };
  }
};
