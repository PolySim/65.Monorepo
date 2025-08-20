import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getUser } from "./action/user.action";
import { UserRole } from "./model/user.model";

const isAuthRoute = createRouteMatcher(["/auth(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/api/(.*)",
  "/_next/(.*)",
  "/favicon.ico",
]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, getToken } = await auth();

  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  if (isAdminRoute(req)) {
    const token = await getToken();
    const user = await getUser({ token });
    if (!user.success || user.data?.roleId !== UserRole.ADMIN)
      return NextResponse.redirect(new URL("/", req.url));
    return NextResponse.next();
  }

  if (!isAuthRoute(req)) {
    if (!userId) {
      return NextResponse.redirect(new URL("/auth/signIn", req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
