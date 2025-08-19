"use server";

import { config } from "@/config/config";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

export const getGpxFile = async (path: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for fetching gpx file");
      return { success: false };
    }
    const response = await fetch(`${config.API_URL}/gpx?path=${path}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      console.error("Error in fetching gpx file", response.statusText);
      return { success: false };
    }
    return { success: true, data: await response.text() };
  } catch (error) {
    console.error("Error in fetching gpx file", error);
    return { success: false };
  }
};

export const createGpxFile = async (hikeId: string, file: FormData) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for creating gpx file");
      return { success: false };
    }

    const response = await fetch(`${config.API_URL}/gpx/create/${hikeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: file,
    });

    if (!response.ok) {
      console.error("Error in creating gpx file", response.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in creating gpx file", error);
    return { success: false };
  }
};

export const deleteGpxFile = async (hikeId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for deleting gpx file");
      return { success: false };
    }

    const response = await fetch(`${config.API_URL}/gpx/delete/${hikeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Error in deleting gpx file", response.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in deleting gpx file", error);
    return { success: false };
  }
};
