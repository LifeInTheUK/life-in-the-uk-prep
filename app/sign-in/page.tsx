import type { Metadata } from "next";
import { Suspense } from "react";
import SignInPage from "@/src/SignInPage";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: true },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <SignInPage />
    </Suspense>
  );
}
