# Based.bid integration handoff

Status: adapter ready for partner review; live submission awaiting the joint API contract.

This adapter is based on Based.bid's public launch fields and documentation. It does not claim a completed partnership or call an undocumented endpoint.

## What is implemented

- Validated ZeitMint bundle input
- Token name, symbol, description and artwork mapping
- Website, X and Telegram mapping
- Solana auto-mapping and explicit Base/EVM chain selection
- Pool, Flash Token and Board launch intent
- DEX, starting market cap and initial-buy intent
- Pre-graduation, graduation and post-graduation fee intent in basis points
- Missing-required-field output
- Explicit creator and Based.bid approval flags
- No signing, deployment, liquidity configuration or fund movement

## HTTP draft request

```http
POST /api/v1/partner/based-bid/draft
Content-Type: application/json
Authorization: Bearer <partner-token>
```

```json
{
  "bundle": {
    "launchKit": {},
    "utilityManifest": {},
    "readinessReport": {}
  },
  "options": {
    "chain": "solana",
    "launchType": "pool",
    "startingMarketCapUsd": 9000,
    "feeIntent": {
      "postGraduationTradingFeeBps": 100
    }
  }
}
```

The complete request schema is published in `public/partner-api.json`.

Partner tokens are stored only in the server-side `ZEITMINT_PARTNER_KEYS` JSON environment variable. Based.bid receives its own long random token; no token is shipped in the SDK or browser.

Generate and sync a token with:

```bash
npm run partner:key -- based-bid
npm run env:vercel
```

## Required partner decisions

Based.bid's developers need to confirm:

1. Submission endpoint and environment URLs
2. Authentication and credential rotation
3. Idempotency-key format and retry behavior
4. Canonical chain, launch-type and DEX identifiers
5. Logo upload versus hosted-URL handling
6. Fee-builder field names, constraints and units
7. Draft creation versus immediate launch semantics
8. Validation-error and partial-failure response shapes
9. Webhook signing and launch-status events
10. Testnet or sandbox acceptance criteria

## Proposed live contract

ZeitMint should submit only a creator-approved draft. Based.bid should return a partner draft ID and review URL. The creator then completes any wallet, fee, compliance, liquidity or deployment action inside Based.bid.

Recommended response fields:

```json
{
  "partnerDraftId": "string",
  "status": "needs-review",
  "reviewUrl": "https://www.based.bid/...",
  "acceptedVersion": "1.0",
  "warnings": []
}
```

Contact: [devs@zeitmint.com](mailto:devs@zeitmint.com)
