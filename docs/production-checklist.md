# ZeitMint production checklist

This checklist separates repository guarantees from settings that live in Vercel, Telegram, DNS or a partner system.

## Required before announcing a deployment

- Deploy the commit containing the same SDK version published on npm.
- Confirm `www.zeitmint.com` is the production domain and `zeitmint.com` redirects to it.
- Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as sensitive production and preview variables.
- Submit a real founding-list signup and confirm that it arrives in the intended configured Telegram chat.
- Stage Vercel Firewall rules in log mode before enforcing them. Start at five to ten times expected legitimate traffic, review the matched requests, test enforcement on a preview deployment and only then publish a production rate limit. Candidate steady-state ceilings are approximately 5 requests per minute per source IP for `/api/waitlist` and 20 for `/api/visit`; partner endpoints need limits based on the pilot workload. Vercel counters are regional, so observed global traffic can exceed one region's configured ceiling.
- Enable Vercel Web Analytics or another privacy-reviewed aggregate monitor only after updating the Privacy Notice if its data footprint changes.
- Confirm `devs@zeitmint.com` can send and receive, and that SPF, DKIM and DMARC pass.
- Review `/privacy` and `/terms` with qualified counsel before accepting payment or providing a regulated service.

## Partner API

- Generate a unique bearer token for each launchpad with `npm run partner:key -- <partner-id>`.
- Share partner tokens only through a private channel; never place them in browser code or public documentation.
- Rotate a token immediately if it appears in logs, screenshots, chat history or a repository.
- Verify the production capability endpoint reports the same SDK version as npm.
- Keep partner submission, token deployment, signing and fund movement disabled until a reviewed connector exists.

## Optional Robinhood Chain testnet experiment

- Set `NEXT_PUBLIC_RH_REGISTRY_ADDRESS` only to the verified testnet registry deployment.
- Keep the interface labelled testnet and independent.
- Do not reuse the provenance registry address as a launchpad, liquidity or Uniswap integration address.

## Payments

- The current website must continue to state that checkout is not live.
- Before enabling a crypto payment, implement wallet-native transaction construction, server-side confirmation, replay protection, order records, expiry and support/refund handling.
- Display the network, asset, exact amount and recipient before a wallet request.
- Never ask a user to copy an address from a direct message when the product can construct and verify the transaction itself.

## Release verification

Run `npm run check`, then verify the production deployment serves:

- `/`, `/privacy`, `/terms`, `/robots.txt`, `/sitemap.xml` and `/manifest.webmanifest`;
- `/.well-known/zeitmint.json` with the published SDK version;
- `/api/v1/partner/capabilities` with the optional v4 integration; and
- the expected security headers without exposing `X-Powered-By`.
