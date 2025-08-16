"use server";

import { config } from "@/config/config";
import { Difficulty } from "@/model/difficulty.model";
import { auth } from "@clerk/nextjs/server";

export const getDifficulties = async () => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching difficulties");
      return { success: false };
    }
    const res = await fetch(`${config.API_URL}/difficulties`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
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
