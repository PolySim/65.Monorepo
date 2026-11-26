import { config } from "@/config/config";
import { getAuthHeaders } from "@/lib/auth-headers";

const privateHeaders = { "Cache-Control": "private, no-store" };

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hikeId: string }> },
) {
  const headers = await getAuthHeaders();
  if (!headers) return new Response(null, { status: 401, headers: privateHeaders });
  const { hikeId } = await params;
  if (hikeId === "." || hikeId === "..") {
    return new Response(null, { status: 404, headers: privateHeaders });
  }
  try {
    // The upstream AuthGuard checks the forwarded session; no separate lookup here.
    const upstream = await fetch(
      `${config.API_URL}/hikes/${encodeURIComponent(hikeId)}/favorite`,
      { headers, cache: "no-store", redirect: "error", signal: _request.signal },
    );
    if (!upstream.ok) {
      return new Response(null, { status: upstream.status, headers: privateHeaders });
    }
    const { isFavorite } = await upstream.json();
    if (typeof isFavorite !== "boolean") throw new Error("Invalid favorite status");
    return Response.json({ isFavorite }, { headers: privateHeaders });
  } catch {
    return new Response(null, { status: 502, headers: privateHeaders });
  }
}
