import type { Metadata } from "next";
import ProfilePage from "@/src/ProfilePage";

export const metadata: Metadata = {
    title: "Your Profile",
    robots: { index: false, follow: true },
};

export default function Page() {
    return <ProfilePage />;
}
