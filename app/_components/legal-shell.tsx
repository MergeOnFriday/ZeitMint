import Link from "next/link";
import type { ReactNode } from "react";

type LegalShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function LegalShell({ eyebrow, title, description, children }: LegalShellProps) {
  return (
    <main className="legal-page">
      <nav className="legal-nav" aria-label="Legal page navigation">
        <Link className="brand" href="/" aria-label="Return to ZeitMint home">
          <span className="brand-mark" aria-hidden="true">ZM</span>
          <span>ZeitMint</span>
        </Link>
        <Link className="button button-small button-ghost" href="/">Back to product ↗</Link>
      </nav>
      <header className="legal-hero">
        <span className="section-index">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <small>Effective 3 August 2026</small>
      </header>
      <article className="legal-document">{children}</article>
      <footer className="legal-footer">
        <span>© 2026 ZeitMint · Independent project</span>
        <div>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <a href="mailto:devs@zeitmint.com">devs@zeitmint.com</a>
        </div>
      </footer>
    </main>
  );
}
