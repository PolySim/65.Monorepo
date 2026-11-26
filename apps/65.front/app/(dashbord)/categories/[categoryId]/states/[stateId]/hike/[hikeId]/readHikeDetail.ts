import "server-only";

import { config } from "@/config/config";
import { getAuthHeaders } from "@/lib/auth-headers";
import type { Hike } from "@/model/hike.model";
import { toHikeDetail, type HikeDetail } from "./hikeDetail.model";

type DetailResult =
  | { status: "ready"; hike: HikeDetail }
  | { status: "missing" | "error" };

export async function readHikeDetail(id: string): Promise<DetailResult> {
  if (id === "." || id === "..") return { status: "missing" };
  try {
    const headers = await getAuthHeaders();
    if (!headers) return { status: "error" };
    const response = await fetch(`${config.API_URL}/hikes/${encodeURIComponent(id)}`, {
      headers,
      cache: "no-store",
      redirect: "error",
    });
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "error" };
    // Nest's detail endpoint can return an empty 200 for a missing DB row.
    const body = await response.text();
    if (!body.trim()) return { status: "missing" };
    const hike = JSON.parse(body) as Hike | null;
    if (hike === null) return { status: "missing" };
    if (hike.id !== id || typeof hike.title !== "string") {
      return { status: "error" };
    }
    return { status: "ready", hike: toHikeDetail(hike) };
  } catch {
    return { status: "error" };
  }
}
