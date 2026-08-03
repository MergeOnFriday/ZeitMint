# @zeitmint/launch-kit

Typed, deterministic launch-readiness and partner-handoff primitives for token launch platforms.

The SDK validates ZeitMint Launch Kit v1, Utility Manifest v1 and readiness reports, checks cross-document consistency and maps an approved bundle into a launchpad-owned draft. It never deploys a token, signs a transaction, moves funds or configures liquidity.

## Install

```bash
npm install @zeitmint/launch-kit
```

The package is source-ready in the ZeitMint repository. Public npm publication requires a ZeitMint npm account and is tracked separately from SDK readiness.

## Validate a bundle

```ts
import { validateBundle } from "@zeitmint/launch-kit";

const result = validateBundle({
  launchKit,
  utilityManifest,
  readinessReport,
});

if (!result.valid) {
  console.error(result.issues);
  return;
}

console.log(result.value.launchKit.token.symbol);
```

Validation is deterministic and performs no network requests. `validateBundle` checks each JSON Schema and verifies that project name, ticker and chain agree across the supplied documents.

## Build a partner draft

```ts
import {
  createBasedBidDraft,
  validateBasedBidDraftOptions,
  validateBundle,
} from "@zeitmint/launch-kit";

const bundle = validateBundle(payload);
const options = validateBasedBidDraftOptions({
  chain: "solana",
  launchType: "pool",
});

if (bundle.valid && options.valid) {
  const draft = createBasedBidDraft(bundle.value, options.value);
  // Map the reviewed draft into the partner-owned launch flow.
}
```

The Based.bid adapter is a field mapper, not a live submission client. Its `submissionStatus` remains `awaiting-partner-api-contract` until Based.bid confirms endpoint, authentication, idempotency and error semantics.

## Public API

- Builders for all three ZeitMint documents
- JSON Schema validators and throwing parsers
- Cross-document bundle validation
- Normalized partner handoff
- Based.bid draft mapping and option validation
- ESM, CommonJS and TypeScript declarations

## Compatibility and versioning

The SDK is side-effect free and supports Node.js 18 or newer. Schema and handoff versions are explicit. Breaking field changes require a new major SDK version or a new document version.

## Security boundary

The SDK accepts untrusted JSON but does not fetch submitted URLs or execute submitted content. Consumers remain responsible for request-size limits, rate limiting, project ownership checks, moderation, compliance, contract review and final launch approval.
