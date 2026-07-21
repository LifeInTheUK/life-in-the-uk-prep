import type { Metadata } from "next";
import HomePage from "@/src/HomePage";

export const metadata: Metadata = {
    description:
        "Practice the Life in the UK test for free. Spaced-repetition questions from the official study material, with a review list and progress tracking.",
};

export default function Page() {
    return <HomePage />;
}
