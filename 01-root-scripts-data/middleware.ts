import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { PRIMARY_DOMAIN, REDIRECT_SOURCE_HOSTS } from "@/lib/constants";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || url.host).toLowerCase();
  const hostname = host.split(":")[0];
  const forwardedProto = (request.headers.get("x-forwarded-proto") || url.protocol.replace(":", "")).toLowerCase();
  const needsHostRedirect = hostname !== PRIMARY_DOMAIN;
  const needsHttpsRedirect = forwardedProto !== "https";

  if (!needsHostRedirect && !needsHttpsRedirect) {
    return NextResponse.next();
  }

  if (hostname === PRIMARY_DOMAIN || REDIRECT_SOURCE_HOSTS.has(hostname) || hostname === "localhost" || hostname === "127.0.0.1") {
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return NextResponse.next();
    }

    url.protocol = "https:";
    url.host = PRIMARY_DOMAIN;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|templates/).*)"
  ]
};
