let currentUserId: string | null = null;

export function setAuthState(userId: string | null): void {
    currentUserId = userId;
}

export function getAuthState(): string | null {
    return currentUserId;
}
