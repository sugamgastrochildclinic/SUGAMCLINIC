"use client";

import { useEffect } from "react";

// App Router route-level error boundary. Catches render/runtime errors in the
// public pages and shows a friendly recovery UI instead of a raw error overlay
// (e.g. the opaque "[object Event]" that a non-Error throw produces).
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real cause for diagnostics (the overlay message can be useless
    // when the thrown value isn't a proper Error).
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-brand-blush/20 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-brand-border shadow-xl p-8 text-center">
        <h1 className="font-heading font-bold text-2xl text-brand-ink mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-brand-muted mb-6">
          An unexpected error occurred. Please try again — if it keeps happening,
          refresh the page.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="bg-teal text-white hover:bg-teal-dark px-6 py-3 rounded-xl font-bold transition-all shadow-md cursor-pointer"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-3 rounded-xl font-bold border border-brand-border text-brand-ink hover:bg-brand-blush transition-all"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  );
}
