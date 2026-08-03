import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-page">
      <span className="section-index">404 / SIGNAL LOST</span>
      <h1>This route never launched.</h1>
      <p>The page may have moved, or the link may be incomplete.</p>
      <Link className="button button-primary" href="/">Return to ZeitMint ↗</Link>
    </main>
  );
}
