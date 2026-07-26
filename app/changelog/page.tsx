import type { Metadata } from "next";
import ChangelogPage from "@/src/ChangelogPage";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Release history for the Life in the UK test prep app.",
};

export default function Page() {
  return <ChangelogPage />;
}
