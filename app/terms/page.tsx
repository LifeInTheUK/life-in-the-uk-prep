import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Terms and Conditions — Life in the UK Prep",
};

export default function TermsPage() {
    return (
        <div className="order-2 sm:order-3 flex flex-col gap-5 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 py-2 sm:p-7 text-sm text-muted leading-relaxed">
            <div>
                <h2 className="text-lg font-semibold text-ink mb-1">
                    Terms and Conditions
                </h2>
                <p className="text-xs text-muted">Last updated: 21 July 2026</p>
            </div>

            <p>
                By using Life in the UK Prep ("the app"), you agree to these
                terms. If you don't agree, please don't use the app.
            </p>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    What the app is for
                </h3>
                <p>
                    The app is a free, unofficial study aid for practicing
                    questions in the style of the "Life in the UK" test. It
                    is not affiliated with, endorsed by, or a substitute for
                    official Home Office study materials, and we don't
                    guarantee the accuracy, completeness, or currency of any
                    question or answer.
                </p>
                <p>
                    Using this app does not guarantee that you will pass the
                    official test. You remain responsible for consulting
                    official sources before your test.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    Accounts and sign-in
                </h3>
                <p>
                    Signing in with Google is optional. If you sign in, you
                    must provide accurate information via your Google
                    account and are responsible for keeping your account
                    secure.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Acceptable use</h3>
                <p>
                    Don't misuse the app — for example, by attempting to
                    disrupt it, scrape it at scale, or use it for any
                    unlawful purpose.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">
                    No warranty, limitation of liability
                </h3>
                <p>
                    The app is provided "as is," without warranties of any
                    kind. To the fullest extent permitted by law, we are not
                    liable for any damages arising from your use of, or
                    inability to use, the app.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Changes to the app</h3>
                <p>
                    We may change, suspend, or discontinue the app, or these
                    terms, at any time without notice.
                </p>
            </section>

            <section className="flex flex-col gap-2">
                <h3 className="font-semibold text-ink">Contact</h3>
                <p>
                    Questions about these terms? Email{" "}
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
