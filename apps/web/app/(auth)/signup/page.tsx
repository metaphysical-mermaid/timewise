import { Suspense } from "react";
import { AuthForm } from "../AuthForm";

export default function SignupPage() {
  return (
    <main className="app-stack-screen flex min-h-full flex-col justify-center">
      <h1 className="app-title mb-2">Create account</h1>
      <p className="app-subtitle mb-6">Start tracking your days with Timewise.</p>
      <Suspense fallback={<p className="app-hint">Loading…</p>}>
        <AuthForm mode="signup" />
      </Suspense>
    </main>
  );
}
