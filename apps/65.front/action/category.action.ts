"use server";

import { config } from "@/config/config";
import { Category } from "@/model/category.model";
import { auth } from "@clerk/nextjs/server";

export const getCategories = async () => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching categories");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/categories`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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
