import type { Metadata } from "next";
import FriendsPage from "@/src/FriendsPage";

export const metadata: Metadata = {
  title: "Friends",
  description: "Compete against your friends on the Life in the UK test.",
  robots: { index: false, follow: true },
};

export default function Page() {
  return <FriendsPage />;
}
