"use server";

import { config } from "@/config/config";
import { auth } from "@clerk/nextjs/server";
import { revalidateTag } from "next/cache";

export const createImage = async ({
  hikeId,
  formData,
}: {
  hikeId: string;
  formData: FormData;
}) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for creating image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/hike/${hikeId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!res.ok) {
      console.error("Error in creating image", res.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in creating image", error);
    return { success: false };
  }
};

export const deleteImage = async (imageId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for deleting image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error in deleting image", res.statusText);
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleting image", error);
    return { success: false };
  }
};

export const rotateImage = async (imageId: string, hikeId: string) => {
  try {
    const { getToken } = await auth();
    const token = await getToken();

    if (!token) {
      console.error("Unauthorized for rotating image");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/images/rotate/${imageId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      console.error("Error in rotating image", res.statusText);
      return { success: false };
    }

    revalidateTag(`hike-${hikeId}`);

    return { success: true };
  } catch (error) {
    console.error("Error in rotating image", error);
    return { success: false };
  }
};
