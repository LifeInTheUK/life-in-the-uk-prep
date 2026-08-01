import type { Metadata } from "next";
import { Suspense } from "react";
import ReviewPage from "@/src/ReviewPage";

export const metadata: Metadata = {
    title: "Review Answers",
    robots: { index: false, follow: true },
};

export default function Page() {
    return (
        <Suspense>
            <ReviewPage />
        </Suspense>
    );
}
