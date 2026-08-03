import type { Metadata } from "next";
import LegalShell from "@/app/_components/legal-shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the ZeitMint website, SDK and launch-readiness tools.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalShell
      eyebrow="TERMS OF USE"
      title="Tools for preparation—not a promise of launch or profit."
      description="These terms apply to the ZeitMint website, public validators, generated documents and partner-facing software."
    >
      <section>
        <h2>1. What ZeitMint provides</h2>
        <p>
          ZeitMint provides launch-readiness checks, creative demonstrations, utility-manifest
          tools, portable launch documents and software for launchpad integrations. ZeitMint is
          not a token issuer, broker, exchange, investment adviser, custodian or launchpad.
        </p>
      </section>

      <section>
        <h2>2. No financial advice or guaranteed outcome</h2>
        <p>
          Scores, concepts, reports and examples are informational and structural. They do not
          establish legal compliance, originality, market demand, token safety or likely returns.
          Nothing on the site is financial, legal or tax advice, an offer of securities or a
          promise that a launchpad will accept or endorse a project.
        </p>
      </section>

      <section>
        <h2>3. Current payment and launch boundary</h2>
        <p>
          The current website does not collect payment, deploy tokens, initialize liquidity,
          execute swaps, custody assets or automate rewards. Any future paid engagement must be
          confirmed separately with its scope, receiving address, network and terms before you
          send funds. Never send crypto solely because an address appears in an unsolicited message.
        </p>
      </section>

      <section>
        <h2>4. Your responsibilities</h2>
        <p>When using ZeitMint, you agree that you will:</p>
        <ul>
          <li>provide information you are entitled to use;</li>
          <li>review generated material before publishing or submitting it;</li>
          <li>avoid impersonation, copied brands, deceptive claims and unlawful promotion;</li>
          <li>perform your own contract, ownership, compliance and risk review; and</li>
          <li>not use the service to manipulate markets, manufacture engagement or mislead buyers.</li>
        </ul>
      </section>

      <section>
        <h2>5. Generated material and intellectual property</h2>
        <p>
          You remain responsible for checking names, tickers, artwork directions, copy and links.
          Similarity checks shown in demonstrations are not trademark clearance. The standalone
          SDK is licensed under the license included with its package and repository; other site
          materials remain subject to their applicable notices.
        </p>
      </section>

      <section>
        <h2>6. Third-party services and blockchains</h2>
        <p>
          Emblem, Uniswap, Solana, Robinhood Chain, wallets and other named platforms are separate
          third parties unless explicitly stated otherwise. Integration targets do not imply a
          partnership or endorsement. Third-party services and public blockchains have their own
          risks, fees, availability and terms.
        </p>
      </section>

      <section>
        <h2>7. Availability and liability</h2>
        <p>
          The service is provided on an “as available” basis and may change, pause or contain
          errors. To the extent permitted by applicable law, ZeitMint is not liable for trading
          losses, failed launches, lost keys, third-party conduct, blockchain activity or decisions
          made from generated material. Nothing here excludes liability that cannot legally be excluded.
        </p>
      </section>

      <section>
        <h2>8. Contact and changes</h2>
        <p>
          Questions can be sent to <a href="mailto:devs@zeitmint.com">devs@zeitmint.com</a>.
          We may update these terms as the service changes; continued use after an update means
          the updated terms apply to later use.
        </p>
      </section>
    </LegalShell>
  );
}
