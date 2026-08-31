"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="app-screen">
      <h1 className="app-title">Something went wrong</h1>
      <p className="app-error-box mt-4">{error.message || "Failed to load this page."}</p>
      <button type="button" className="app-btn-primary mt-4" onClick={() => reset()}>
        Try again
      </button>
      <a href="/login" className="app-link mt-4 block text-center">
        Back to sign in
      </a>
    </main>
  );
}
