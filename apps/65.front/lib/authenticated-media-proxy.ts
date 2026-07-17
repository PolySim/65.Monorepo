import "server-only";

import { config } from "@/config/config";
import { NextRequest } from "next/server";

export const proxyAuthenticatedMedia = async (
  request: NextRequest,
  endpoint: string,
  allowedParameters: readonly string[],
) => {
  const cookie = request.headers.get("cookie");
  if (!cookie) {
    return new Response(null, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const target = new URL(endpoint, `${config.API_URL.replace(/\/$/, "")}/`);
  for (const parameter of allowedParameters) {
    const value = request.nextUrl.searchParams.get(parameter);
    if (value !== null) target.searchParams.set(parameter, value);
  }

  if (!target.searchParams.get("path")) {
    return new Response(null, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const upstream = await fetch(target, {
      headers: { cookie },
      cache: "no-store",
      redirect: "manual",
      signal: request.signal,
    });
    const headers = new Headers();

    for (const header of [
      "content-disposition",
      "content-length",
      "content-type",
    ]) {
      const value = upstream.headers.get(header);
      if (value) headers.set(header, value);
    }

    headers.set(
      "Cache-Control",
      upstream.ok
        ? (upstream.headers.get("cache-control") ?? "private, no-store")
        : "no-store",
    );

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return new Response(null, {
      status: 502,
      headers: { "Cache-Control": "no-store" },
    });
  }
};
