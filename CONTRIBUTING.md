# Contributing to ZeitMint

ZeitMint is currently a partner-preview project. Please discuss substantial changes with the maintainers before opening a pull request.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Never commit `.env`, `.env.local`, wallet secrets, bot tokens, private keys or production user data.

Before submitting a change, run:

```bash
npm run lint
npm run build
```

Changes to Launch Kit, Utility Manifest or readiness-report fields should update the corresponding JSON Schema and documentation in the same pull request. Keep launchpad-specific behavior behind an adapter and preserve the non-custodial handoff boundary.
