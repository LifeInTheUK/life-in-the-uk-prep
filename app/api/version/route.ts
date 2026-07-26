import { NextResponse } from "next/server";
import { VERCEL_GIT_COMMIT_SHA } from "@/src/config";
import { sql } from "@/src/db";

// Deliberately uncached: this endpoint exists to defeat stale caching on
// backgrounded/bfcache'd tabs, so a heuristically-cached response here would
// silently defeat the entire feature it powers.
export const dynamic = "force-dynamic";

export async function GET() {
  let release;
  if (VERCEL_GIT_COMMIT_SHA) {
    try {
      const rows = await sql`SELECT message, released_at FROM releases WHERE sha = ${VERCEL_GIT_COMMIT_SHA}`;
      release = rows[0];
    } catch {
      // DB outage shouldn't disable SHA-only stale-build detection - the
      // client's mismatch check only needs `sha`, message/releasedAt are
      // a nice-to-have on top of it.
    }
  }

  return NextResponse.json(
    {
      sha: VERCEL_GIT_COMMIT_SHA,
      message: release ? (release.message as string) : null,
      releasedAt: release ? Number(release.released_at) : null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
