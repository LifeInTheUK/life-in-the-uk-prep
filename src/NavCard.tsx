import Link from "next/link";
import type { ReactNode } from "react";

export default function NavCard({
    href,
    title,
    subtitle,
}: {
    href: string;
    title: string;
    subtitle?: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between gap-3 p-3 rounded-xl border border-line hover:border-accent transition-colors"
        >
            <div className="min-w-0">
                <p className="text-sm font-medium">{title}</p>
                {subtitle && <div className="text-xs text-muted truncate">{subtitle}</div>}
            </div>
            <svg
                className="w-4 h-4 text-muted shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                />
            </svg>
        </Link>
    );
}
