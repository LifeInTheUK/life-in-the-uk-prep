import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
    env: {
        // VERCEL_GIT_COMMIT_SHA is auto-set by Vercel at build time (empty
        // locally) — re-exposed under NEXT_PUBLIC_ so it's inlined into the
        // client bundle for the footer version display.
        NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
    },
};

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default withBundleAnalyzer(nextConfig);
