import type { StoredSession } from "./types";

export const SESSION_STORAGE_KEY = "ukTestSession";

export function saveSession(stored: StoredSession): void {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function loadStoredSession(): StoredSession | null {
  const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;

  try {
    const stored = JSON.parse(raw) as StoredSession;
    if (!Array.isArray(stored.sessionQueue) || stored.sessionQueue.length === 0) {
      return null;
    }
    return stored;
  } catch {
    return null;
  }
}
