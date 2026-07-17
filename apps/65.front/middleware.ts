import { NextRequest, NextResponse } from "next/server";
import { config as appConfig } from "./config/config";
import { UserRole } from "./model/user.model";

const isAuthRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/auth");
const isPublicRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/api/") ||
  request.nextUrl.pathname.startsWith("/_next/") ||
  request.nextUrl.pathname === "/favicon.ico";
const isAdminRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/admin");

const getSession = async (request: NextRequest) => {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const response = await fetch(`${appConfig.API_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
};

export default async function middleware(request: NextRequest) {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const session = await getSession(request);

  if (isAuthRoute(request) && session) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!session && !isAuthRoute(request)) {
    return NextResponse.redirect(new URL("/auth/signIn", request.url));
  }

  if (isAdminRoute(request)) {
    const cookie = request.headers.get("cookie");
    try {
      const userResponse = await fetch(`${appConfig.API_URL}/users`, {
        headers: cookie ? { cookie } : {},
        cache: "no-store",
      });

      if (!userResponse.ok) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      const user = await userResponse.json();
      if (user.roleId === UserRole.ADMIN) {
        return NextResponse.next();
      }
    } catch {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
