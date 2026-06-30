import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = new Set(["/", "/login", "/register", "/gmail", "/outlook", "/pricing", "/about", "/faq", "/forgot-password", "/reset-password", "/privacy", "/terms", "/sso", "/verify-email"]);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // CSRF defense-in-depth: reject cross-origin mutations against our API.
  if (req.method !== "GET" && req.method !== "HEAD" && pathname.startsWith("/api/")) {
    const origin = req.headers.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== req.headers.get("host")) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      } catch {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }
  }

  if (!req.auth && !PUBLIC_PATHS.has(pathname) && !pathname.startsWith("/features/")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
