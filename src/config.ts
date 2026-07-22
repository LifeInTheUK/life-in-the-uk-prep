// Single place to read process.env — everything else imports from here
// instead of reaching into process.env directly. NEXT_PUBLIC_-prefixed vars
// are safe to read in client-bundled code (Next.js inlines them at build
// time); the rest (DATABASE_URL, NEON_AUTH_*) resolve to `undefined` in the
// browser and must only be imported by server-only files (API routes,
// lib/auth/server.ts, src/db.ts).

export const DATABASE_URL = process.env.DATABASE_URL!;
export const NEON_AUTH_BASE_URL = process.env.NEON_AUTH_BASE_URL!;
export const NEON_AUTH_COOKIE_SECRET = process.env.NEON_AUTH_COOKIE_SECRET!;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Official test length is 24 questions; override with NEXT_PUBLIC_SESSION_SIZE
// (e.g. in .env.development) to use a shorter session while developing.
export const SESSION_SIZE =
  Number(process.env.NEXT_PUBLIC_SESSION_SIZE) || 24;
