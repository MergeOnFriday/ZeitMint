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

## Optional Uniswap v4 intent

EVM launchpads using Uniswap v4 can import the separate integration entry point. It validates protocol-shaped PoolKey inputs, orders currencies, encodes static or dynamic fees and verifies the permissions encoded in a hook address.

```ts
import { validateBundle } from "@zeitmint/launch-kit";
import {
  createUniswapV4PoolIntent,
  validateUniswapV4PoolIntentOptions,
} from "@zeitmint/launch-kit/integrations/uniswap-v4";

const bundle = validateBundle(payload);
const options = validateUniswapV4PoolIntentOptions({
  chainId: 8453,
  poolManager: "0x0000000000000000000000000000000000001000",
  tokenAddress: "0x0000000000000000000000000000000000000100",
  quoteCurrency: "native",
  fee: "dynamic",
  tickSpacing: 60,
  hookAddress: "0x0000000000000000000000000000000000000080",
  expectedHookPermissions: ["beforeSwap"],
  initialSqrtPriceX96: "79228162514264337593543950336",
});

if (bundle.valid && options.valid) {
  const intent = createUniswapV4PoolIntent(bundle.value, options.value);
  // Verify the real deployment and hook bytecode, then construct the
  // launchpad-owned transaction from the reviewed intent.
}
```

The addresses above are format-valid examples, not deployment addresses. The integration performs no RPC calls and deliberately does not deploy hooks, initialize pools, add liquidity, sign transactions or move funds. The consuming launchpad must verify its PoolManager deployment and hook bytecode on the target EVM chain. The core package remains protocol-agnostic, and this integration does not apply to Solana launches.

## Public API

- Builders for all three ZeitMint documents
- JSON Schema validators and throwing parsers
- Cross-document bundle validation
- Normalized partner handoff
- Universal launchpad draft mapping and option validation
- Optional Uniswap v4 PoolKey and hook-intent validation
- Namespaced partner extension fields
- ESM, CommonJS and TypeScript declarations

## Compatibility and versioning

The SDK is side-effect free and supports Node.js 18 or newer. Schema and handoff versions are explicit. Breaking field changes require a new major SDK version or a new document version.

## Security boundary

The SDK accepts untrusted JSON but does not fetch submitted URLs or execute submitted content. Consumers remain responsible for request-size limits, rate limiting, project ownership checks, moderation, compliance, contract review and final launch approval.
