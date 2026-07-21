import type { Metadata } from "next";
import QuizPage from "@/src/QuizPage";

export const metadata: Metadata = {
    title: "Take the Test",
    robots: { index: false, follow: true },
};

export default function Page() {
    return <QuizPage />;
}
