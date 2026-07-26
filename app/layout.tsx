import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import Header from "@/src/Header";
import AuthSync from "@/src/AuthSync";
import UpdateModal from "@/src/UpdateModal";
import CookieBanner from "@/src/CookieBanner";
import { HeaderStatsProvider } from "@/src/headerStats";
import { ThemeProvider } from "@/src/themeContext";
import { CookieConsentProvider } from "@/src/cookieConsentContext";
import { ProgressProvider } from "@/src/progressContext";
import { HistoryProvider } from "@/src/historyContext";
import { FeedbackProvider } from "@/src/feedbackContext";
import { QuizProvider } from "@/src/quiz/QuizContext";
import { SITE_URL } from "@/src/config";
import "@/src/style.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

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

const THEME_INIT_SCRIPT = `
(function () {
    try {
        var stored = localStorage.getItem("theme");
        var isDark =
            stored === "dark" ||
            (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
        if (isDark) document.documentElement.classList.add("dark");
    } catch (e) {}
})();
`;

const COOKIE_CONSENT_INIT_SCRIPT = `
(function () {
    try {
        if (localStorage.getItem("ukTestCookieConsent")) {
            document.documentElement.classList.add("consent-given");
        }
    } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
                <script
                    dangerouslySetInnerHTML={{ __html: COOKIE_CONSENT_INIT_SCRIPT }}
                />
            </head>
            <body className={`${inter.className} min-h-screen text-ink`}>
                <ThemeProvider>
                    <CookieConsentProvider>
                        <ProgressProvider>
                            <HistoryProvider>
                                <FeedbackProvider>
                                    <HeaderStatsProvider>
                                        <QuizProvider>
                                            <AuthSync />
                                            <UpdateModal />
                                            <Header>{children}</Header>
                                        </QuizProvider>
                                    </HeaderStatsProvider>
                                </FeedbackProvider>
                            </HistoryProvider>
                        </ProgressProvider>
                        <Analytics />
                        <CookieBanner />
                    </CookieConsentProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
