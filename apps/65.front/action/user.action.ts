"use server";

import { config } from "@/config/config";
import { User } from "@/model/user.model";
import { auth } from "@clerk/nextjs/server";

export const getUser = async (props?: { token: string | null }) => {
  try {
    let token = props?.token ?? null;
    if (!token) {
      const { getToken } = await auth();
      token = await getToken();
    }

    if (!token) {
      console.error("Unauthorized for fetching user");
      return { success: false };
    }

    const res = await fetch(`${config.API_URL}/users`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "force-cache",
      next: {
        tags: ["users"],
      },
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
