# ZeitMint partner integration

ZeitMint is a launch-readiness and creative handoff layer for token projects. It is designed to improve the quality of projects arriving at a launchpad, not to replace the launchpad.

Emblem is the preferred design-partner and handoff target. This repository does not claim an existing partnership, affiliation or endorsement.

## Proposed flow

1. A creator completes deterministic launch-readiness checks.
2. ZeitMint helps structure the identity, narrative and campaign direction.
3. The creator defines useful community work as a draft Utility Manifest.
4. ZeitMint exports Launch Kit v1, Utility Manifest v1 and the readiness report.
5. A launchpad validates the documents and maps approved fields into its own draft flow.
6. The launchpad remains responsible for contracts, tokenomics, compliance, liquidity, deployment and final approval.

## Integration surface

The current integration surface is intentionally small and portable:

- `public/launch-kit.schema.json`
- `public/utility-manifest.schema.json`
- `public/readiness-report.schema.json`
- `app/lib/launch-kit.ts`
- `app/lib/utility-manifest.ts`
- `app/lib/readiness.ts`

The `@zeitmint/launch-kit` v0.1 workspace exposes parsing, deterministic validation, bundle consistency and mapping helpers. The versioned Partner API provides the same validation contract over HTTP. Neither surface deploys tokens, moves funds or takes control of a launchpad workflow.

## Integration entry points

- SDK source: `packages/launch-kit`
- Partner API contract: `https://zeitmint.com/partner-api.json`
- Discovery: `https://zeitmint.com/.well-known/zeitmint.json`
- Capabilities: `GET /api/v1/partner/capabilities`
- Bundle validation: `POST /api/v1/partner/validate`
- Based.bid draft mapping: `POST /api/v1/partner/based-bid/draft`

The SDK is ready for partner testing. Public npm publication is a distribution task and remains pending until a ZeitMint npm organization is configured.

## Trust boundaries

- Creator declarations remain self-reported until independently verified.
- URL validation confirms format, not ownership or safety.
- Utility funding and completed work are not verified in the current release.
- ZeitMint does not custody mission rewards or automate payouts.
- The checkout shown on the site is a demo and does not currently move funds.
- Optional provenance records a content hash; it does not establish endorsement or launch approval.

## Design-partner pilot

A useful first pilot would use sample or testnet projects and answer four questions:

1. Which ZeitMint fields reduce launchpad intake work?
2. Which fields require launchpad-specific validation or moderation?
3. What should be imported automatically versus reviewed manually?
4. Which completion receipts would make community utility verifiable without adding custody?

The smallest technical pilot is a read-only importer that accepts Launch Kit v1, Utility Manifest v1 and the readiness report, validates them against the schemas and creates a launchpad-owned draft. That importer can use the SDK directly or call the Partner API.

## Contact

Partnership and integration discussions: [devs@zeitmint.com](mailto:devs@zeitmint.com)
