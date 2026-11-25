import { NextRequest, NextResponse } from "next/server";
import { AUTH_ACCOUNT_HEADER, config as appConfig } from "./config/config";
import { UserRole } from "./model/user.model";

const isAuthRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/auth");
const isPublicRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/api/") ||
  request.nextUrl.pathname.startsWith("/_next/") ||
  request.nextUrl.pathname === "/favicon.ico";
const isAdminRoute = (request: NextRequest) =>
  request.nextUrl.pathname.startsWith("/admin");

const withAccount = (request: NextRequest, accountId: string) => {
  const headers = new Headers(request.headers);
  // Always overwrite the incoming value with the identity verified by the API.
  headers.set(AUTH_ACCOUNT_HEADER, accountId);
  return NextResponse.next({ request: { headers } });
};

const getAccountId = async (request: NextRequest) => {
  const cookie = request.headers.get("cookie");
  if (!cookie) return null;

  try {
    const response = await fetch(`${appConfig.API_URL}/api/auth/get-session`, {
      headers: { cookie },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const session = await response.json();
    const id = session?.user?.id;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
};

export default async function middleware(request: NextRequest) {
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  if (isAdminRoute(request)) {
    const cookie = request.headers.get("cookie");
    if (!cookie) {
      return NextResponse.redirect(new URL("/auth/signIn", request.url));
    }

    try {
      const userResponse = await fetch(`${appConfig.API_URL}/users`, {
        headers: { cookie },
        cache: "no-store",
      });

      if (userResponse.status === 401) {
        return NextResponse.redirect(new URL("/auth/signIn", request.url));
      }

      if (!userResponse.ok) {
        return NextResponse.redirect(new URL("/", request.url));
      }

      const user = await userResponse.json();
      return user.roleId === UserRole.ADMIN &&
        typeof user.authUserId === "string" && user.authUserId
        ? withAccount(request, user.authUserId)
        : NextResponse.redirect(new URL("/", request.url));
    } catch {
      return NextResponse.redirect(new URL("/auth/signIn", request.url));
    }
  }

  const accountId = await getAccountId(request);

  if (isAuthRoute(request)) {
    return accountId
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  return accountId
    ? withAccount(request, accountId)
    : NextResponse.redirect(new URL("/auth/signIn", request.url));
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
