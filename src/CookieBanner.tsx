"use client";

import Link from "next/link";
import { useCookieConsent } from "./cookieConsentContext";

export default function CookieBanner() {
    const { hasConsented, accept } = useCookieConsent();

    if (hasConsented) return null;

    return (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-slate-800 text-white px-4 py-4 sm:py-3">
            <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-3">
                <p className="text-xs text-white/80 flex-1 text-center sm:text-left">
                    We use a strictly necessary cookie to keep you signed in,
                    and Vercel Analytics to understand site usage. See our{" "}
                    <Link href="/privacy" className="underline hover:text-white">
                        Privacy Policy
                    </Link>
                    .
                </p>
                <button
                    onClick={accept}
                    className="w-full sm:w-auto flex-shrink-0 bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2 px-4 rounded-xl transition-all"
                >
                    Accept
                </button>
            </div>
        </div>
    );
}
