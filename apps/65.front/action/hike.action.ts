"use server";

import { config } from "@/config/config";
import {
  CreateHikeDto,
  Hike,
  HikeFilter,
  HikeSearch,
  UpdateHikeDto,
} from "@/model/hike.model";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

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

export const getHikeById = async (id: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching hike");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/${id}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "force-cache",
      next: {
        tags: [`hike-${id}`],
      },
    });

    if (!res.ok) {
      console.error("Error in fetching hike", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as Hike;
    return { success: true, data };
  } catch (error) {
    console.error("Error in fetching hike", error);
    return { success: false };
  }
};

export const getHikeFavorites = async () => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching hike favorites");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/favorites`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Error in fetching hike favorites", res.statusText);
      return { success: false };
    }

    const data = (await res.json()) as HikeSearch[];
    return { success: true, data };
  } catch (error) {
    console.error("Error in fetching hike favorites", error);
    return { success: false };
  }
};

export const toggleFavorite = async (hikeId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for toggling favorite");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/toggle-favorite`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ hikeId }),
    });

    if (!res.ok) {
      console.error("Error in toggling favorite", res.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in toggling favorite", error);
    return { success: false };
  }
};

export const createHike = async (hike: CreateHikeDto) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for creating hike");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hike),
    });

    if (!res.ok) {
      console.error("Error in creating hike", res.statusText);
      return { success: false };
    }

    revalidateTag("hikes");

    const data = (await res.json()) as Hike;
    return { success: true, data };
  } catch (error) {
    console.error("Error in creating hike", error);
    return { success: false };
  }
};

export const updateHike = async (hike: UpdateHikeDto) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for updating hike");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/hikes/update`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(hike),
    });

    if (!res.ok) {
      console.error("Error in updating hike", res.statusText);
      return { success: false };
    }

    revalidateTag("hikes");
    revalidateTag(`hike-${hike.id}`);

    const data = (await res.json()) as Hike;
    return { success: true, data };
  } catch (error) {
    console.error("Error in updating hike", error);
    return { success: false };
  }
};
