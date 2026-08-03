# ZeitMint

A Vercel-ready Next.js product for checking token launch readiness, designing community utility and turning a cultural signal into an Emblem-ready, multichain creative launch kit. It includes a deterministic project validator, Community Mission builder, downloadable Utility Manifest and readiness reports, three curated creative directions, a Launch Kit v1 JSON handoff, optional provenance and a waitlist form.

[Live product](https://zeitmint.com) · [SDK showcase](https://zeitmint.com/#sdk) · [Utility builder](https://zeitmint.com/#utility) · [Partnership contact](mailto:devs@zeitmint.com)

ZeitMint is the creative layer above launchpads. Emblem is the preferred partnership and handoff target, Solana is the default chain, and the same kit can travel to Robinhood Chain or another EVM workflow. ZeitMint does not deploy tokens, configure liquidity or replace the launch platform selected by the creator.

Emblem is a partnership target, not a current partner, affiliation or endorsement.

## Partner review

ZeitMint gives launchpads a structured intake layer before deployment. A creator can validate the project, develop a differentiated identity, define useful community work and export portable JSON for a launchpad-owned flow. The launchpad retains control of contracts, tokenomics, compliance, liquidity and final approval.

| Surface | Current status |
| --- | --- |
| Launch-readiness validator | Working browser implementation |
| Launch Kit v1 | Working builder, export and public JSON Schema |
| Utility Manifest v1 | Working mission builder, export and public JSON Schema |
| [`@zeitmint/launch-kit`](https://www.npmjs.com/package/@zeitmint/launch-kit) | Universal v0.3.0 release with optional Uniswap v4 integration |
| Partner API v1 | Versioned validation, capabilities and universal draft routes |
| Crypto checkout | Non-transactional demo |
| Robinhood Chain provenance | Optional testnet experiment |

The proposed partner flow, integration boundaries and design-partner questions are documented in [`docs/partner-integration.md`](docs/partner-integration.md).

## Free launch validator

The homepage validator performs ten deterministic checks across identity, narrative, public presence and creator declarations. It produces a score out of 100, separates blockers from warnings, copies a plain-text launchpad handoff and downloads a structured JSON readiness report.

Validation runs entirely in the browser; project data is not submitted or stored. URL checks validate format only. Ownership, availability, trademark, contract and regulatory checks remain separate and are stated as limitations in every report.

The public readiness-report JSON Schema lives at `/readiness-report.schema.json`, and the scoring implementation lives in `app/lib/readiness.ts`.

## Utility Manifest v1

The Community Mission builder turns a useful contribution brief into a portable Utility Manifest. It validates the project and ticker, requires a concrete deliverable and submission criteria, records rewards and self-declared funding, requires original work and rejects missions based on buying, shilling, raids, likes or reposts.

Drafts are versioned and saved only to local browser storage. ZeitMint does not host submissions, verify funding, custody rewards or automate payouts in this release. Every generated mission remains a draft, and its utility proof remains unverified until hosted completion receipts are built.

The public JSON Schema lives at `/utility-manifest.schema.json`, and the deterministic implementation lives in `app/lib/utility-manifest.ts`.

## Run locally

Requires Node.js 22.13 or newer.

```bash
git clone <your-fork-or-repository-url>
cd zeitmint
npm ci
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

All environment files are ignored except `.env.example`. Add real values only to `.env.local` or Vercel; never commit them.

## Waitlist

Waitlist signups and one anonymous visit alert per browser session are sent to a Telegram bot. The visitor alert includes only the page path, referring hostname and timestamp; it does not include an IP address.

1. Create a bot by messaging `@BotFather` in Telegram and running `/newbot`.
2. Add the token to the ignored `.env.local` file:

```dotenv
TELEGRAM_BOT_TOKEN=your_bot_token
```

3. Message the bot, then find the destination chat ID without exposing the token:

```bash
npm run telegram:chat-id
```

4. Add the returned ID to `.env.local` and restart the development server:

```dotenv
TELEGRAM_CHAT_ID=your_chat_id
```

To send alerts to a Telegram group instead, add the bot to that group, send a bot command in the group and run `npm run telegram:chat-id` again.

## Crypto payment

The current checkout is intentionally a non-transactional demo. It does not request a signature, move funds, or store private keys.

For a simple production v1, use a wallet adapter and a 49 USDC transfer to a configured recipient, then verify the transaction server-side before creating the launch job. A custom contract is only necessary if you need escrow, refunds, or automatic revenue splits. Keep the payment recipient and network in Vercel environment variables.

## Launch Kit v1

The studio creates a stable JSON package containing token metadata, creative direction, campaign copy, handoff boundaries and creator-review flags. The handoff records a preferred launchpad and chain, defaulting to Emblem and Solana, while preserving an open format for other launchpads and EVM chains. Users can download the JSON or copy an Emblem-ready plain-text brief.

The public JSON Schema lives at `/launch-kit.schema.json`. The browser implementation lives in `app/lib/launch-kit.ts`; the published SDK provides typed helpers for launchpads to validate and import kits.

## Partner SDK and API

The `packages/launch-kit` workspace contains `@zeitmint/launch-kit` v0.3.0. It builds ESM, CommonJS and TypeScript declarations; validates all three public schemas; checks name, ticker and chain consistency across a bundle; and maps an approved bundle into a neutral launchpad-owned draft.

The core SDK is protocol-agnostic. EVM launchpads can optionally import `@zeitmint/launch-kit/integrations/uniswap-v4` to create and validate a protocol-shaped PoolKey and hook intent. That integration orders currencies and validates fees, tick spacing, initial price bounds and hook permission flags, but does not deploy hooks, initialize a pool, add liquidity, sign or move funds. Solana and Emblem workflows continue to use the universal handoff without a Uniswap dependency.

Build, test and inspect the release tarball locally with:

```bash
npm run sdk:test
npm run sdk:pack
```

The deployed partner API exposes:

- `GET /api/v1/partner/capabilities`
- `POST /api/v1/partner/validate`
- `POST /api/v1/partner/{partner}/draft`
- `GET /partner-api.json`
- `GET /.well-known/zeitmint.json`

The API is stateless, performs no network calls from submitted content and limits request bodies to 256 KiB. Public bundle validation is unauthenticated; partner draft routes require a partner-specific bearer token configured in the server-only `ZEITMINT_PARTNER_KEYS` JSON variable. It does not deploy, sign, move funds or submit a launch. Vercel Firewall rate limits should be configured before announcing the endpoint broadly.

Create a bearer token for any launchpad ID, then sync it through the existing Vercel environment flow:

```bash
npm run partner:key -- your-launchpad
npm run env:vercel
```

The generator stores the token in ignored `.env.local`, applies owner-only file permissions and prints the new token once so it can be shared privately. Use `--rotate` to replace an existing partner token.

The shareable showcase is available at `https://zeitmint.com/#sdk`, with partnership contact at `devs@zeitmint.com`.

The universal handoff maps public launch fields and fee intent into a review draft. Optional partner fields live under `options.extensions`; live submission remains disabled until each launchpad implements its own reviewed connector.

## Optional Robinhood Chain provenance

ZeitMint includes an early, independent Robinhood Chain testnet provenance option. It is a secondary multichain experiment, not the main launch route. It can add/switch an injected EVM wallet to chain ID `46630` and register the Launch Kit v1 content hash as a creator-owned receipt. The registry does not deploy a token, choose a launchpad, move funds or grant any admin privileges.

Run the contract tests:

```bash
forge test
```

To deploy the registry without placing a private key in a command or file, first import a dedicated testnet wallet into Foundry's encrypted keystore:

```bash
cast wallet import zeitmint-deployer --interactive
forge create contracts/src/ZeitMintCreativeKitRegistry.sol:ZeitMintCreativeKitRegistry \
  --rpc-url https://rpc.testnet.chain.robinhood.com \
  --chain 46630 \
  --account zeitmint-deployer \
  --broadcast
```

Fund only that dedicated wallet with testnet ETH. After deployment, configure the returned public contract address:

```dotenv
NEXT_PUBLIC_RH_REGISTRY_ADDRESS=0xYourDeployedContract
```

Restart the development server to enable the “Register provenance proof” button. `npm run deploy` will sync the public contract address to Vercel when it is present.

This integration does not imply affiliation, partnership or endorsement by Robinhood.

## Deploy to Vercel

Copy `.env.example` to the ignored `.env.local` file and configure the deployment-specific public values and server-only secrets there. Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser; Telegram credentials must remain server-only.

The project includes a one-command deployment that securely syncs the private and public values to the already-linked Vercel project before deploying:

```bash
npm run deploy
```

On a new machine, install the CLI with `npm install -g vercel`, then run `vercel login` and `vercel link` once before that command. If you deploy through Vercel's Git dashboard instead, run `npm run env:vercel` once after linking the project; Vercel intentionally does not upload `.env.local` from Git.

Verify production locally with:

```bash
npm run build
npm start
```

## Repository policy

- Report security issues privately using [`SECURITY.md`](SECURITY.md).
- Review contribution expectations in [`CONTRIBUTING.md`](CONTRIBUTING.md).
- The website remains source-available for partner evaluation under the root [`LICENSE`](LICENSE). The standalone SDK in `packages/launch-kit` is MIT licensed for integration and adoption.
