"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import Skeleton from "./Skeleton";

const MIN_PASSWORD_LENGTH = 8;

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackURL = searchParams.get("callbackURL") || "/";
  // Only allow same-site relative paths — a "//evil.com" or "https://evil.com"
  // value would otherwise let this query param redirect to an attacker's site.
  const callbackURL = /^\/(?!\/|\\)/.test(rawCallbackURL) ? rawCallbackURL : "/";
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "signin";

  const { data: session, isPending } = authClient.useSession();

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpStatus, setOtpStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent">("idle");

  const [forgotStep, setForgotStep] = useState<"hidden" | "request" | "reset">("hidden");
  const [forgotStatus, setForgotStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [resetOtp, setResetOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) router.replace(callbackURL);
  }, [session, callbackURL, router]);

  if (isPending || session?.user) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Sign in</h2>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const emailValid = /\S+@\S+\.\S+/.test(email);
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit =
    emailValid &&
    passwordValid &&
    status !== "submitting" &&
    (mode === "signin" || (name.trim().length > 0 && confirmPassword === password));

  async function submit() {
    if (!canSubmit) return;
    setStatus("submitting");
    setErrorMessage(null);
    setAwaitingVerification(false);
    setResetSuccessMessage(null);

    // @neondatabase/auth's fetch layer throws on any non-2xx response
    // (AuthApiError) rather than resolving { error } like plain better-auth
    // clients do, so both calls below need a try/catch, not an error check.
    if (mode === "signin") {
      try {
        await authClient.signIn.email({ email, password, callbackURL });
      } catch (err) {
        // A signup that never got OTP-verified (e.g. code expired, tab
        // closed) leaves an account that can't sign in *or* re-signup
        // ("user already exists") — the only way out is back through OTP
        // verification, so route there instead of a dead-end error.
        const code = (err as { code?: string })?.code;
        if (code === "email_not_confirmed") {
          try {
            await authClient.emailOtp.sendVerificationOtp({
              email,
              type: "email-verification",
            });
          } catch {
            // best-effort resend — the user can still hit "Resend code" manually
          }
          setAwaitingVerification(true);
          setStatus("done");
          return;
        }
        setErrorMessage("Invalid email or password.");
        setStatus("done");
        return;
      }
      router.push(callbackURL);
      return;
    }

    let data;
    try {
      ({ data } = await authClient.signUp.email({
        email,
        password,
        name: name.trim(),
        callbackURL,
      }));
    } catch (err) {
      // normalizeBetterAuthError maps better-auth's raw "USER_ALREADY_EXISTS"
      // code down to this lowercase AuthErrorCode before throwing.
      const code = (err as { code?: string })?.code;
      const message = (err as { message?: string })?.message;
      setErrorMessage(
        code === "user_already_exists"
          ? "An account with this email already exists — sign in instead."
          : message || "Something went wrong, try again.",
      );
      setStatus("done");
      return;
    }
    if (data?.token) {
      router.push(callbackURL);
      return;
    }
    setAwaitingVerification(true);
    setStatus("done");
  }

  async function verifyOtp() {
    if (otp.trim().length === 0 || otpStatus === "submitting") return;
    setOtpStatus("submitting");
    setOtpError(null);
    try {
      await authClient.emailOtp.verifyEmail({ email, otp: otp.trim() });
    } catch (err) {
      setOtpError((err as { message?: string })?.message || "Invalid or expired code.");
      setOtpStatus("done");
      return;
    }
    router.push(callbackURL);
  }

  async function resendOtp() {
    if (resendStatus === "sending") return;
    setResendStatus("sending");
    try {
      await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
      setResendStatus("sent");
    } catch {
      setResendStatus("idle");
    }
  }

  async function requestPasswordReset() {
    if (!emailValid || forgotStatus === "submitting") return;
    setForgotStatus("submitting");
    setForgotError(null);
    try {
      await authClient.emailOtp.requestPasswordReset({ email });
    } catch (err) {
      setForgotError(
        (err as { message?: string })?.message || "Something went wrong, try again.",
      );
      setForgotStatus("done");
      return;
    }
    setForgotStatus("idle");
    setForgotStep("reset");
  }

  const newPasswordValid = newPassword.length >= MIN_PASSWORD_LENGTH;
  const canResetPassword =
    resetOtp.trim().length > 0 &&
    newPasswordValid &&
    confirmNewPassword === newPassword &&
    forgotStatus !== "submitting";

  async function resetPassword() {
    if (!canResetPassword) return;
    setForgotStatus("submitting");
    setForgotError(null);
    try {
      await authClient.emailOtp.resetPassword({
        email,
        otp: resetOtp.trim(),
        password: newPassword,
      });
    } catch (err) {
      setForgotError(
        (err as { message?: string })?.message || "Invalid or expired code.",
      );
      setForgotStatus("done");
      return;
    }
    setForgotStep("hidden");
    setForgotStatus("idle");
    setResetOtp("");
    setNewPassword("");
    setConfirmNewPassword("");
    setPassword("");
    setMode("signin");
    setResetSuccessMessage("Password reset — sign in with your new password.");
  }

  if (awaitingVerification) {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-muted">
          We sent a 6-digit code to {email} — enter it below to verify your account.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="signin-otp" className="text-sm font-semibold text-ink">
            Verification code
          </label>
          <input
            id="signin-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(e) => {
              setOtp(e.target.value);
              setOtpError(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {otpStatus === "done" && otpError && (
          <p className="text-sm text-bad">{otpError}</p>
        )}

        <button
          type="button"
          disabled={otp.trim().length === 0 || otpStatus === "submitting"}
          onClick={verifyOtp}
          className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {otpStatus === "submitting" ? "Verifying..." : "Verify email"}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={resendOtp}
            disabled={resendStatus === "sending"}
            className="text-sm font-medium text-accent hover:opacity-80 transition-opacity disabled:opacity-40"
          >
            {resendStatus === "sent" ? "Code resent" : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setAwaitingVerification(false);
              setStatus("idle");
            }}
            className="text-sm font-medium text-muted hover:text-ink transition-colors"
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (forgotStep === "request") {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Reset your password</h2>
        <p className="text-sm text-muted">
          Enter your account email and we'll send you a code to reset your password.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="signin-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setForgotError(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        {forgotStatus === "done" && forgotError && (
          <p className="text-sm text-bad">{forgotError}</p>
        )}

        <button
          type="button"
          disabled={!emailValid || forgotStatus === "submitting"}
          onClick={requestPasswordReset}
          className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {forgotStatus === "submitting" ? "Sending..." : "Send reset code"}
        </button>

        <button
          type="button"
          onClick={() => {
            setForgotStep("hidden");
            setForgotError(null);
            setForgotStatus("idle");
          }}
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (forgotStep === "reset") {
    return (
      <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
        <h2 className="text-lg font-semibold">Reset your password</h2>
        <p className="text-sm text-muted">
          We sent a 6-digit code to {email} — enter it below with your new password.
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="reset-otp" className="text-sm font-semibold text-ink">
            Reset code
          </label>
          <input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={resetOtp}
            onChange={(e) => {
              setResetOtp(e.target.value);
              setForgotError(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="new-password" className="text-sm font-semibold text-ink">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setForgotError(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-[11px] text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm-new-password" className="text-sm font-semibold text-ink">
            Confirm new password
          </label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              setForgotError(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
          {confirmNewPassword.length > 0 && confirmNewPassword !== newPassword && (
            <p className="text-xs text-bad">Passwords don't match.</p>
          )}
        </div>

        {forgotStatus === "done" && forgotError && (
          <p className="text-sm text-bad">{forgotError}</p>
        )}

        <button
          type="button"
          disabled={!canResetPassword}
          onClick={resetPassword}
          className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {forgotStatus === "submitting" ? "Resetting..." : "Reset password"}
        </button>

        <button
          type="button"
          onClick={() => {
            setForgotStep("hidden");
            setForgotError(null);
            setForgotStatus("idle");
          }}
          className="self-start text-sm font-medium text-muted hover:text-ink transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="order-3 flex flex-col gap-6 sm:bg-surface sm:rounded-2xl sm:border sm:border-line sm:shadow-lg sm:shadow-slate-200/60 dark:shadow-none py-2 sm:p-7">
      <h2 className="text-lg font-semibold">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h2>

      <button
        type="button"
        onClick={() => authClient.signIn.social({ provider: "google", callbackURL })}
        className="w-full bg-accent hover:bg-accent-dark active:scale-[0.98] text-white font-medium text-sm py-2.5 px-4 rounded-xl transition-all"
      >
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-line" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-line" />
      </div>

      <div className="flex gap-2 p-1 rounded-xl bg-bg border border-line">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
            mode === "signin" ? "bg-surface shadow text-ink" : "text-muted"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 text-sm font-medium py-1.5 rounded-lg transition-colors ${
            mode === "signup" ? "bg-surface shadow text-ink" : "text-muted"
          }`}
        >
          Create account
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <label htmlFor="signin-name" className="text-sm font-semibold text-ink">
              Name
            </label>
            <input
              id="signin-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label htmlFor="signin-email" className="text-sm font-semibold text-ink">
            Email
          </label>
          <input
            id="signin-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrorMessage(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="signin-password" className="text-sm font-semibold text-ink">
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrorMessage(null);
            }}
            className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
          />
          {mode === "signup" && (
            <p className="text-[11px] text-muted">
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
          {mode === "signin" && (
            <button
              type="button"
              onClick={() => {
                setResetSuccessMessage(null);
                setForgotError(null);
                setForgotStep("request");
              }}
              className="self-end text-xs font-medium text-accent hover:opacity-80 transition-opacity"
            >
              Forgot password?
            </button>
          )}
        </div>

        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <label
              htmlFor="signin-confirm-password"
              className="text-sm font-semibold text-ink"
            >
              Confirm password
            </label>
            <input
              id="signin-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage(null);
              }}
              className="w-full text-sm bg-bg border border-line rounded-lg p-3 focus:outline-none focus:border-accent transition-colors"
            />
            {confirmPassword.length > 0 && confirmPassword !== password && (
              <p className="text-xs text-bad">Passwords don't match.</p>
            )}
          </div>
        )}
      </div>

      {mode === "signin" && resetSuccessMessage && (
        <p className="text-sm text-good">{resetSuccessMessage}</p>
      )}

      {status === "done" && errorMessage && (
        <p className="text-sm text-bad">{errorMessage}</p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="w-full bg-accent hover:bg-accent-dark text-white font-medium text-sm py-2.5 px-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {status === "submitting"
          ? "Please wait..."
          : mode === "signin"
            ? "Sign in"
            : "Create account"}
      </button>
    </div>
  );
}
