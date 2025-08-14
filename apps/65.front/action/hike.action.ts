"use server";

import { config } from "@/config/config";
import { HikeFilter, HikeSearch } from "@/model/hike.model";
import { auth } from "@clerk/nextjs/server";

export const getHikes = async (filters: HikeFilter) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching hikes");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/filters`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(filters),
      cache: "force-cache",
      next: {
        tags: ["hikes"],
      },
    });

    if (!res.ok) {
      console.error("Error in fetching hikes", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as HikeSearch[];
    return { success: true, data };
  } catch (error) {
    console.error("Error in fetching hikes", error);
    return { success: false };
  }
};
