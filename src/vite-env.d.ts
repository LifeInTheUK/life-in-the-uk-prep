/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SESSION_SIZE?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
