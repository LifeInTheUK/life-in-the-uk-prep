import type { Metadata } from "next";
import ProposeQuestionPage from "@/src/ProposeQuestionPage";

export const metadata: Metadata = {
  title: "Propose a question",
  description: "Suggest a new question for the Life in the UK test question bank.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <ProposeQuestionPage />;
}
