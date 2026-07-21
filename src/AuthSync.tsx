"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { setAuthState } from "./authState";
import { pullProgressFromServer } from "./sm2";
import { pullHistoryFromServer } from "./history";

export default function AuthSync() {
    const { data: session, status } = useSession();
    const syncedForEmail = useRef<string | null>(null);

    useEffect(() => {
        if (status === "loading") return;

        const email = session?.user?.email ?? null;
        setAuthState(email);

        if (email && syncedForEmail.current !== email) {
            syncedForEmail.current = email;
            pullProgressFromServer();
            pullHistoryFromServer();
        }
    }, [status, session]);

    return null;
}
