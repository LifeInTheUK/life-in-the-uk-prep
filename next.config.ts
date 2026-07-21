import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // QuizPage bridges into quiz.ts's imperative DOM code (initQuiz() attaches
    // event listeners directly via document.getElementById, with no cleanup).
    // Strict Mode's dev-only double-invoked effects would double-attach those
    // listeners to the same DOM nodes, causing every click to be handled
    // twice — silently breaking multi-select toggling.
    reactStrictMode: false,
};

export default nextConfig;
