// scripts/record-release.ts
//
// Runs automatically as npm's postbuild lifecycle script (see package.json)
// after every `next build`. No-ops outside a production Vercel build so it
// never needs DATABASE_URL locally or on preview/branch deploys - the
// VERCEL_ENV check below must stay the very first thing this script does,
// before any DB import, so a missing DATABASE_URL never becomes a build
// failure in those environments.
async function main() {
  if (process.env.VERCEL_ENV !== "production") {
    console.log("record-release: not a production build, skipping.");
    return;
  }

  const sha = (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7);
  const message = process.env.VERCEL_GIT_COMMIT_MESSAGE || "";

  if (!sha || !message) {
    console.log("record-release: missing commit SHA or message, skipping.");
    return;
  }

  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  await sql`
    INSERT INTO releases (sha, message, released_at)
    VALUES (${sha}, ${message}, ${Date.now()})
    ON CONFLICT (sha) DO NOTHING
  `;
  console.log(`record-release: recorded ${sha}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
