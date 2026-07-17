import { proxyAuthenticatedMedia } from "@/lib/authenticated-media-proxy";
import { NextRequest } from "next/server";

export const GET = (request: NextRequest) =>
  proxyAuthenticatedMedia(request, "/gpx", ["path"]);
