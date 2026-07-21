import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SessionProvider } from "next-auth/react";
import Header from "@/src/Header";
import AuthSync from "@/src/AuthSync";
import "@/src/style.css";

const inter = Inter({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
    title: "Life in the UK Test Prep",
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
            </body>
        </html>
    );
}
