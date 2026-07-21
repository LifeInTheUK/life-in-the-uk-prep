let currentUserEmail: string | null = null;

export function setAuthState(email: string | null): void {
    currentUserEmail = email;
}

export function getAuthState(): string | null {
    return currentUserEmail;
}
