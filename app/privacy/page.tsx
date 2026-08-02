import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How Life in the UK Prep collects, uses, and protects your data.",
};

export default function PrivacyPage() {
    return (
        <div className="order-2 sm:order-3 flex flex-col gap-5 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7 text-sm text-muted leading-relaxed">
            <div>
                <h1 className="text-lg font-semibold text-ink mb-1">
                    Privacy Policy
                </h1>
                <p className="text-xs text-muted">Last updated: 2 August 2026</p>
            </div>

            <p>
                This Privacy Policy explains what data Life in the UK Prep
                ("the app") collects, how it's used, and who it's shared
                with.
            </p>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">What we collect</h3>
                <p>
                    <strong className="text-ink">Quiz progress.</strong> Your
                    answers and spaced-repetition scheduling data are kept in
                    memory in your browser for the current tab only, and
                    aren't sent to us unless you sign in. If you sign in,
                    this data is also synced to our database so it follows
                    you across devices. If you later delete your account,
                    this synced data is kept in anonymized form for
                    aggregate statistics, unless you separately request full
                    erasure.
                </p>
                <p>
                    <strong className="text-ink">Test completions.</strong>{" "}
                    Whether or not you're signed in, we record that a test
                    was completed and its score, so we can report aggregate
                    usage (e.g. how many tests have been taken). If you're
                    signed out, this record isn't linked to you in any way —
                    no name, email, or IP address is stored alongside it.
                </p>
                <p>
                    <strong className="text-ink">Account information.</strong>{" "}
                    If you sign in with Google, we receive your name, email
                    address, and profile photo from Google, and use your
                    Google account to identify you and link it to your
                    synced progress. If you sign in with email and password
                    instead, we store the email address and a securely
                    hashed password you provide, and use that email address
                    to send you account-related emails (a verification code
                    when you sign up, and a password-reset code if you
                    request one).
                </p>
                <p>
                    <strong className="text-ink">Feedback and reports.</strong>{" "}
                    If you report a question, submit a question proposal, or
                    send app feedback, we store the text you submit along
                    with your IP address. We use the IP address to prevent
                    abuse (e.g. rate-limiting and blocking repeated spam
                    submissions) — it isn't used for any other purpose.
                </p>
                <p>
                    <strong className="text-ink">Analytics.</strong> We use
                    Vercel Analytics to understand aggregate site usage
                    (e.g. which pages are visited). This does not use
                    tracking cookies and does not identify you personally.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Cookies</h3>
                <p>
                    We use one strictly necessary cookie, set by our
                    authentication provider (Neon Auth), to keep you signed
                    in. This cookie is required for sign-in to function and
                    is not used for advertising or cross-site tracking.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    Who we share data with
                </h3>
                <p>
                    We don't sell or share your data with advertisers. Data
                    is processed by the service providers that operate the
                    app: Google (sign-in), Vercel (hosting and analytics),
                    and Neon (database storage for synced progress and
                    account data).
                </p>
                <p>
                    If you use the friends feature, adding a friend shares
                    your name and overall accuracy with that friend on a
                    leaderboard — this is visible to friends you've added,
                    not the public.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    Your rights and choices
                </h3>
                <p>
                    You can use the app fully without signing in — in that
                    case, the only thing we record is an anonymous count of
                    completed tests (see "Test completions" above), nothing
                    that identifies you. If you've signed in,
                    you can permanently delete your account at any time from
                    your{" "}
                    <a
                        href="/profile"
                        className="text-accent hover:text-accent-dark underline"
                    >
                        Profile page
                    </a>
                    . This removes your sign-in and personal details (name,
                    email, profile photo). Your quiz progress and test
                    history stay in our database, no longer linked to your
                    identity, so we can keep aggregate statistics — if you'd
                    like that data fully erased too, email us at{" "}
                    <a
                        href="mailto:contact@sonnyweb.mailer.me"
                        className="text-accent hover:text-accent-dark underline"
                    >
                        contact@sonnyweb.mailer.me
                    </a>{" "}
                    and we'll remove it.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Children's privacy</h3>
                <p>
                    The app is not directed at children under 13, and we
                    don't knowingly collect data from them.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    Changes to this policy
                </h3>
                <p>
                    We may update this policy from time to time. Continued
                    use of the app after changes means you accept the
                    updated policy.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Contact</h3>
                <p>
                    Questions about this policy? Email{" "}
                    <a
                        href="mailto:contact@sonnyweb.mailer.me"
                        className="text-accent hover:text-accent-dark underline"
                    >
                        contact@sonnyweb.mailer.me
                    </a>
                    .
                </p>
            </section>
        </div>
    );
}
