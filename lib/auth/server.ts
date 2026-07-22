import { createNeonAuth } from "@neondatabase/auth/next/server";
import { NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET } from "@/src/config";

export const auth = createNeonAuth({
  baseUrl: NEON_AUTH_BASE_URL,
  cookies: {
    secret: NEON_AUTH_COOKIE_SECRET,
  },
});
