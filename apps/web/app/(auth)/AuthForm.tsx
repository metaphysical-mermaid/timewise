"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Mode = "login" | "signup";

/**
 * Native form POST to /auth/login or /auth/signup.
 * Sign-in and Set-Cookie happen on the same 303 redirect response,
 * which is reliable on mobile Safari (unlike fetch-then-navigate).
 */
export function AuthForm({ mode }: { mode: Mode }) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const info = searchParams.get("info");
  const action = mode === "signup" ? "/auth/signup" : "/auth/login";

  return (
    <form action={action} method="post" className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-base"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          name="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 text-base"
        />
      </label>
      {error ? <p className="app-error-box">{error}</p> : null}
      {info ? <p className="app-info-box">{info}</p> : null}
      <button type="submit" className="app-btn-primary">
        {mode === "signup" ? "Create account" : "Sign in"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link className="underline" href="/login">
              Sign in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link className="underline" href="/signup">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
