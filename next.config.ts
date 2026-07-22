import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    env: {
        // VERCEL_GIT_COMMIT_SHA is auto-set by Vercel at build time (empty
        // locally) — re-exposed under NEXT_PUBLIC_ so it's inlined into the
        // client bundle for the footer version display.
        NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
    },
};

export default nextConfig;
