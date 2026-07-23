import { NextResponse } from "next/server";
import { VERCEL_GIT_COMMIT_SHA } from "@/src/config";

// Deliberately uncached: this endpoint exists to defeat stale caching on
// backgrounded/bfcache'd tabs, so a heuristically-cached response here would
// silently defeat the entire feature it powers.
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { sha: VERCEL_GIT_COMMIT_SHA },
    { headers: { "Cache-Control": "no-store" } },
  );
}
