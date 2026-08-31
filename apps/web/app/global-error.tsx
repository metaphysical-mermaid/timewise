"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "1.5rem", margin: 0 }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Timewise</h1>
        <p style={{ marginTop: "1rem", color: "#dc2626" }}>
          {error.message || "This page could not load."}
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "none",
            background: "#2563eb",
            color: "#fff",
            fontWeight: 600,
          }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
