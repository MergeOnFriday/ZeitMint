"use client";

import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("ZeitMint page error", error.digest ?? "no-digest");
  }, [error]);

  return (
    <main className="system-page">
      <span className="section-index">TEMPORARY ERROR</span>
      <h1>The signal dropped.</h1>
      <p>Nothing was submitted. Try the page again or return later.</p>
      <button className="button button-primary" onClick={reset}>Try again ↗</button>
    </main>
  );
}
