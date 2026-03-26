# Contributing

Thanks for contributing to ULGEN.

This repository contains the open-source ULGEN codebase only:

- `ulgen-core`
- `ulgen-desktop`
- `ulgen-api-proto`

The hosted backend is intentionally out of scope and should remain in a separate private repository.

## Local Setup

```bash
cd packages/ulgen-desktop
npm install
cd ../..
```

Useful commands from the repository root:

```bash
npm run dev
npm run lint
npm test
npm run test:e2e
npm run ci
```

## Development Guidelines

- Keep cloud provider logic in `packages/ulgen-core`
- Keep UI and desktop shell logic in `packages/ulgen-desktop`
- Keep shared public contracts in `packages/ulgen-api-proto`
- Do not call cloud SDKs directly from the frontend
- Do not add private backend code to this repository
- Prefer small and focused pull requests

## Before Opening a Pull Request

Run and pass:

```bash
npm run lint
npm test
npm run test:e2e
```

## Pull Request Checklist

Include:

- what changed
- why it changed
- how it was tested
- screenshots if the UI changed

## Branching and Releases

- use feature branches from `main`
- use tags in the form `v*` for releases
