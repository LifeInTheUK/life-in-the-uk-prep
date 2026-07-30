import type { Metadata } from "next";
import FriendsAddPage from "@/src/FriendsAddPage";

export const metadata: Metadata = {
  title: "Add Friend",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <FriendsAddPage />;
}
