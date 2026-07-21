import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import Header from "@/src/Header";
import AuthSync from "@/src/AuthSync";
import CookieBanner from "@/src/CookieBanner";
import "@/src/style.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const TITLE = "Life in the UK Test Prep";
const DESCRIPTION =
    "Free practice test for the UK's Life in the UK citizenship test. Spaced-repetition questions drawn from the official study material, with progress tracking and review.";

export const metadata: Metadata = {
    metadataBase: new URL(SITE_URL),
    title: {
        default: TITLE,
        template: `%s — ${TITLE}`,
    },
    description: DESCRIPTION,
    keywords: [
        "Life in the UK test",
        "Life in the UK practice test",
        "UK citizenship test",
        "British citizenship test practice",
        "Life in the UK questions",
        "settlement test UK",
    ],
    robots: {
        index: true,
        follow: true,
    },
    openGraph: {
        title: TITLE,
        description: DESCRIPTION,
        url: SITE_URL,
        siteName: TITLE,
        locale: "en_GB",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: TITLE,
        description: DESCRIPTION,
    },
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen text-ink`}>
                <SessionProvider>
                    <AuthSync />
                    <Header>{children}</Header>
                </SessionProvider>
                <Analytics />
                <CookieBanner />
            </body>
        </html>
    );
}
