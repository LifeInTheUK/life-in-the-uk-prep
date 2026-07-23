"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const CONSENT_KEY = "ukTestCookieConsent";

interface CookieConsentValue {
  hasConsented: boolean;
  accept: () => void;
}

const CookieConsentContext = createContext<CookieConsentValue | null>(null);

export function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [hasConsented, setHasConsented] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY)) {
      setHasConsented(true);
    }
  }, []);

  const value: CookieConsentValue = {
    hasConsented,
    accept: () => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      setHasConsented(true);
    },
  };

  return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent(): CookieConsentValue {
  const ctx = useContext(CookieConsentContext);
  if (!ctx) throw new Error("useCookieConsent must be used within a CookieConsentProvider");
  return ctx;
}
