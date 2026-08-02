import { NextResponse, type NextRequest } from "next/server";

// Rejects API requests that didn't originate from this app's own pages —
// real browser fetch()/XHR calls from our own JS always carry Sec-Fetch-Site:
// same-origin (or same-site behind a proxy), which curl/scripts/other sites
// don't send. This raises the bar against casual scraping/direct API access;
// it can't stop a script that deliberately replicates browser headers.
export function proxy(request: NextRequest) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "same-origin" || secFetchSite === "same-site") {
    return NextResponse.next();
  }

  const origin = request.headers.get("origin");
  if (origin && origin === request.nextUrl.origin) {
    return NextResponse.next();
  }

  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export const config = {
  matcher: ["/api/((?!auth).*)"],
};
