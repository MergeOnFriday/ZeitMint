# Changelog

## 0.3.0 - 2026-08-03

- Added an optional, separately exported Uniswap v4 PoolKey intent integration.
- Added static and dynamic LP fee validation, currency ordering and TickMath price bounds.
- Added hook-address permission decoding, expected-permission matching and return-delta dependency checks.
- Kept pool initialization, hook deployment, liquidity, signing and fund movement outside the SDK.

## 0.2.0 - 2026-08-03

- Replaced the partner-specific root adapter with a universal launchpad handoff profile.
- Added arbitrary launchpad and chain identifiers with portable validation rules.
- Added partner-owned JSON extensions without coupling them to the core schema.
- Added a dynamic authenticated partner draft route.

## 0.1.0 - 2026-08-03

- Added typed Launch Kit v1, Utility Manifest v1 and readiness report builders.
- Added deterministic JSON Schema validation and cross-document bundle checks.
- Added a normalized partner handoff.
- Added the first partner draft proof of concept with explicit launchpad review boundaries.
- Added ESM, CommonJS and TypeScript declaration outputs.
