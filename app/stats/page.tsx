import type { Metadata } from "next";
import StatsPage from "@/src/StatsPage";

export const metadata: Metadata = {
    title: "Your Stats",
    description:
        "See your Life in the UK test progress and how it compares to other users.",
    robots: { index: false, follow: true },
};

export default function Page() {
    return <StatsPage />;
}
