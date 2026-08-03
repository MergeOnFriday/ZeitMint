# @zeitmint/launch-kit

Typed, deterministic launch-readiness and partner-handoff primitives for token launch platforms.

The SDK validates ZeitMint Launch Kit v1, Utility Manifest v1 and readiness reports, checks cross-document consistency and maps an approved bundle into a launchpad-owned draft. It never deploys a token, signs a transaction, moves funds or configures liquidity.

## Install

```bash
npm install @zeitmint/launch-kit
```

The package is publicly available on npm and can be used by any launchpad without a ZeitMint-specific backend.

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
  createLaunchpadDraft,
  validateLaunchpadDraftOptions,
  validateBundle,
} from "@zeitmint/launch-kit";

const bundle = validateBundle(payload);
const options = validateLaunchpadDraftOptions({
  chain: "solana",
  launchType: "pool",
  extensions: { partnerOwnedField: "value" },
});

if (bundle.valid && options.valid) {
  const draft = createLaunchpadDraft(
    bundle.value,
    "your-launchpad",
    options.value,
  );
  // Map the reviewed draft into the partner-owned launch flow.
}
```

The output uses the neutral `zeitmint-launchpad-handoff` profile. Common token, creative, utility and launch-intent fields remain stable, while `options.extensions` carries launchpad-owned JSON without coupling the SDK to a particular platform. Submission always remains partner-controlled.

## Public API

- Builders for all three ZeitMint documents
- JSON Schema validators and throwing parsers
- Cross-document bundle validation
- Normalized partner handoff
- Universal launchpad draft mapping and option validation
- Namespaced partner extension fields
- ESM, CommonJS and TypeScript declarations

## Compatibility and versioning

The SDK is side-effect free and supports Node.js 18 or newer. Schema and handoff versions are explicit. Breaking field changes require a new major SDK version or a new document version.

## Security boundary

The SDK accepts untrusted JSON but does not fetch submitted URLs or execute submitted content. Consumers remain responsible for request-size limits, rate limiting, project ownership checks, moderation, compliance, contract review and final launch approval.
