import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // QuizPage bridges into quiz.ts's imperative DOM code (initQuiz() attaches
    // event listeners directly via document.getElementById, with no cleanup).
    // Strict Mode's dev-only double-invoked effects would double-attach those
    // listeners to the same DOM nodes, causing every click to be handled
    // twice — silently breaking multi-select toggling.
    reactStrictMode: false,
    env: {
        // VERCEL_GIT_COMMIT_SHA is auto-set by Vercel at build time (empty
        // locally) — re-exposed under NEXT_PUBLIC_ so it's inlined into the
        // client bundle for the footer version display.
        NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || "",
    },
};

export default nextConfig;
