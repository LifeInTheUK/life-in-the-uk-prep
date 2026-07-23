"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth/client";
import { setAuthState } from "./authState";
import { useProgress } from "./progressContext";
import { useHistoryState } from "./historyContext";

export default function AuthSync() {
    const { data: session, isPending } = authClient.useSession();
    const syncedForUserId = useRef<string | null>(null);
    const { refreshFromServer: refreshProgress } = useProgress();
    const { refreshFromServer: refreshHistory } = useHistoryState();

    useEffect(() => {
        if (isPending) return;

        const userId = session?.user?.id ?? null;
        setAuthState(userId);

        if (userId && syncedForUserId.current !== userId) {
            syncedForUserId.current = userId;
            refreshProgress();
            refreshHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPending, session]);

    return null;
}
