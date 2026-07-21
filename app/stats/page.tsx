import type { Metadata } from "next";
import StatsPage from "@/src/StatsPage";

export const metadata: Metadata = {
    title: "Your Progress",
    robots: { index: false, follow: true },
};

export default function Page() {
    return <StatsPage />;
}
