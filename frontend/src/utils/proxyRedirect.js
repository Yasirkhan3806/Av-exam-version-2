import { NextResponse } from "next/server";

// Behind a reverse proxy (Nginx -> `next start`), both req.url and
// req.nextUrl resolve to the INTERNAL origin (localhost:<port>), so any
// redirect built from them sends the browser to localhost. Build the target
// from the proxy's forwarded headers instead — Nginx sends X-Forwarded-Host
// and X-Forwarded-Proto (and also rewrites Host to the public name). Falls
// back to req.nextUrl for direct, non-proxied access in local dev.
export function redirectTo(req, pathname) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (!host) {
    const u = req.nextUrl.clone();
    u.pathname = pathname;
    u.search = "";
    return NextResponse.redirect(u);
  }
  const proto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "") ||
    "https";
  return NextResponse.redirect(`${proto}://${host}${pathname}`);
}
