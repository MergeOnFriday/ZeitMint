import type { Metadata } from "next";
import LegalShell from "@/app/_components/legal-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How ZeitMint handles waitlist, visit, local draft and wallet information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalShell
      eyebrow="PRIVACY NOTICE"
      title="Small data footprint. Plain-language boundaries."
      description="This notice explains what the current ZeitMint website processes, where it goes and the choices available to you."
    >
      <section>
        <h2>1. Who operates ZeitMint</h2>
        <p>
          ZeitMint is an independent project. Privacy questions and deletion requests can be
          sent to <a href="mailto:devs@zeitmint.com">devs@zeitmint.com</a>.
        </p>
      </section>

      <section>
        <h2>2. Information processed</h2>
        <h3>Founding-list signups</h3>
        <p>
          If you join the founding list, we process the email address you submit and the
          signup time. The website sends that information to the configured Telegram bot chat
          used by ZeitMint operators. Do not submit sensitive information in the email field.
        </p>
        <h3>Anonymous visit alerts</h3>
        <p>
          Once per browser session, the website may send the visited path, referring hostname
          and time to the same configured Telegram chat. The alert does not include your IP
          address. Vercel and other internet infrastructure may still process IP addresses,
          user-agent strings and request metadata to deliver and protect the service.
        </p>
        <h3>Local drafts</h3>
        <p>
          Utility drafts are stored in your browser&apos;s local storage. The visit-alert flag is
          stored in session storage. ZeitMint does not receive those draft contents unless
          you separately send or submit them.
        </p>
        <h3>Partner API and wallet activity</h3>
        <p>
          Bundle validation is stateless and the application does not intentionally retain
          submitted bundle contents. Hosting logs may retain request metadata. If you use the
          optional testnet provenance experiment, your wallet provider processes your address
          and request, and any submitted transaction becomes public on the relevant blockchain.
          ZeitMint never asks for or receives your private key.
        </p>
      </section>

      <section>
        <h2>3. Why the information is used</h2>
        <p>
          We use founding-list information to respond to prospective users and partners. Visit
          alerts help us understand early interest without installing behavioral analytics.
          Technical request data may be used to operate, secure and troubleshoot the service.
        </p>
      </section>

      <section>
        <h2>4. Service providers and international processing</h2>
        <p>
          ZeitMint uses Vercel for hosting and Telegram for notifications. Their systems may
          process information in countries outside yours under their own terms and privacy
          practices. Links, wallets, launchpads and blockchain networks are separate services.
        </p>
      </section>

      <section>
        <h2>5. Retention and your choices</h2>
        <p>
          Founding-list entries and alerts remain in the configured Telegram chat until removed
          or no longer needed. You can clear local drafts through the product or your browser.
          You may ask us to delete a founding-list entry by emailing us from the address used
          to sign up. Public blockchain records cannot generally be deleted by ZeitMint.
        </p>
      </section>

      <section>
        <h2>6. Cookies, analytics and security</h2>
        <p>
          The current site does not install advertising cookies or third-party behavioral
          analytics. We use reasonable technical safeguards, but no internet service or
          messaging platform can guarantee absolute security.
        </p>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>
          We may update this notice as the product changes. Material changes will be reflected
          on this page with a new effective date.
        </p>
      </section>
    </LegalShell>
  );
}
