import { NextRequest, NextResponse } from "next/server";

// Forward the current pathname to server components as an `x-pathname` header.
// The root layout reads this so it can hide the website's TopNav/footer/chatbot
// when the user is inside the /app route group (the PWA shell).
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on every page request but skip Next internals and static assets so we
  // don't add overhead to image / font / api calls.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|trainly-logo|.*\\..*).*)"],
};
