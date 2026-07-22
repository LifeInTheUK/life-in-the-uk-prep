"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import { setAuthState } from "./authState";
import { pullProgressFromServer } from "./sm2";
import { pullHistoryFromServer } from "./history";

export default function AuthSync() {
    const { data: session, isPending } = authClient.useSession();
    const syncedForUserId = useRef<string | null>(null);

    useEffect(() => {
        if (isPending) return;

        const userId = session?.user?.id ?? null;
        setAuthState(userId);

        if (userId && syncedForUserId.current !== userId) {
            syncedForUserId.current = userId;
            pullProgressFromServer();
            pullHistoryFromServer();
        }
    }, [isPending, session]);

    return null;
}
