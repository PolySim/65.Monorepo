"use server";

import { config } from "@/config/config";
import { auth } from "@clerk/nextjs/server";

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
