# Contributing

## Scope

This repository is for the open-source ULGEN packages only.

Do not add private backend code, credentials, or hosted infrastructure implementation here.

Project maintainer:

- Ahmet Bilğay
- Parevo
- [parevo.co](https://parevo.co)

## Setup

```bash
cd packages/ulgen-desktop
npm install
cd ../..
cargo check
npm run ci
```

## Development Rules

- Keep provider logic in `ulgen-core`
- Do not call AWS SDKs directly from the frontend
- Keep shared contracts in `ulgen-api-proto`
- Keep secrets out of source control
- Prefer small, focused pull requests

## Before Opening a PR

Run:

```bash
npm run lint
npm test
npm run test:e2e
```

## Pull Requests

Include:

- problem statement
- architectural impact
- testing performed
- screenshots if UI changed

## Branching

- feature branches from `main`
- tags in the form `v*` are reserved for releases
