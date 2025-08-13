import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAuthRoute = createRouteMatcher(["/auth(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/api/(.*)",
  "/_next/(.*)",
  "/favicon.ico",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Si c'est une route d'auth et que l'utilisateur est connecté, rediriger vers l'accueil
  if (isAuthRoute(req) && userId) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Si c'est une route publique, permettre l'accès
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Pour les routes protégées (y compris /), vérifier l'authentification
  if (!isAuthRoute(req)) {
    // Si l'utilisateur n'est pas connecté, rediriger vers la connexion
    if (!userId) {
      return NextResponse.redirect(new URL("/auth/signIn", req.url));
    }
    // Si l'utilisateur est connecté, permettre l'accès
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
};
