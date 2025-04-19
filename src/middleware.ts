import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { routeAccessMap } from "./lib/settings";
import { NextResponse } from "next/server";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

console.log(matchers);

export default clerkMiddleware(async (auth, req) => {
  const { sessionClaims, userId } = await auth();

  // If user is not authenticated and trying to access a protected route, redirect to sign-in
  if (!userId && !req.url.includes("/sign-in")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // If user is authenticated, handle role-based access
  if (userId) {
    const role = (
      (sessionClaims?.metadata as { role?: string })?.role || ""
    ).toLowerCase();

    for (const { matcher, allowedRoles } of matchers) {
      if (matcher(req) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
