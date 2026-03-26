# ULGEN

ULGEN is a local-first sovereign infrastructure engine for cloud operations.

Built in Rust, wrapped in Tauri, and designed to keep execution and credentials on the user machine by default.

## What ULGEN Is

ULGEN aims to be a desktop control center for infrastructure operators who want:

- direct control over their cloud accounts
- a fast local runtime instead of a browser-first control plane
- strict separation between local credentials and optional hosted collaboration
- an open core that can grow from AWS into multi-cloud

Today the foundation is AWS-focused, with the core architecture prepared for future provider expansion.

## Core Principles

- Local-first: provider access happens from the user machine
- Zero-cloud-knowledge: cloud credentials are not meant to leave local secure storage
- Open core: the engine and desktop app are open-source
- Optional cloud sync: hosted collaboration is additive, not required
- Provider isolation: UI talks to `ulgen-core`, not directly to cloud SDKs

## Repository Scope

This repository contains the public ULGEN codebase:

- `packages/ulgen-core`
  Rust core engine, provider traits, discovery, operations, vault, db, ssh
- `packages/ulgen-desktop`
  Tauri desktop shell and React frontend
- `packages/ulgen-api-proto`
  shared public types and contracts

This repository does not contain the hosted backend.

The private cloud backend must live in a separate private repository such as `ulgen-server`.

Out of scope here:

- private SaaS backend
- billing
- hosted auth infrastructure
- production team sync implementation

## Project Structure

```text
ulgen/
├── Cargo.toml
├── package.json
├── packages/
│   ├── ulgen-core/
│   ├── ulgen-desktop/
│   └── ulgen-api-proto/
├── docs/
└── .github/workflows/
```

## Current Foundation

Already in place:

- Cargo workspace-based monorepo
- provider abstraction through `CloudProvider`
- AWS EC2 discovery foundation
- Tauri bridge from desktop UI into Rust core
- React desktop shell with three-pane layout
- local test, e2e, lint, CI, and release workflows

Still intentionally incomplete:

- credential onboarding UI
- full instance and security group action wiring
- SSH terminal runtime
- optional hosted sync implementation

## Quick Start

Prerequisites:

- Rust stable
- Node.js 24+
- npm 11+

Install frontend and desktop dependencies:

```bash
cd packages/ulgen-desktop
npm install
cd ../..
```

Run ULGEN in development mode:

```bash
npm run dev
```

## Development Commands

From the repository root:

```bash
npm run dev
npm run lint
npm test
npm run test:e2e
npm run ci
```

What they do:

- `npm run dev`
  starts the Tauri desktop app for development
- `npm run lint`
  runs Rust formatting, Clippy, and TypeScript type checks
- `npm test`
  runs Rust tests and frontend unit tests
- `npm run test:e2e`
  runs Playwright end-to-end tests
- `npm run ci`
  runs the combined local CI flow

## Architecture

High-level flow:

```text
React UI
  -> Tauri commands
    -> ulgen-core
      -> provider implementations
      -> local vault
      -> local db
      -> ssh runtime
```

The UI should never call cloud SDKs directly.

## Documentation

- [Architecture](./ARCHITECTURE.md)
- [Contributing](./CONTRIBUTING.md)
- [Vision](./docs/vision.md)
- [Local-First Model](./docs/local-first.md)
- [Security Model](./docs/security.md)
- [Roadmap](./docs/roadmap.md)
- [AWS Provider Notes](./docs/providers/aws.md)
- [Release Process](./docs/process/release.md)

## CI/CD

GitHub Actions workflows live in `.github/workflows`:

- `lint.yml`
- `ci.yml`
- `release.yml`

`release.yml` builds desktop artifacts for tagged releases only. It does not build or publish any private server component.

Recommended GitHub repository settings:

- protect `main`
- require `Lint` and `CI` status checks before merge
- use tags in the form `v*` for releases
- enable Dependabot updates

## Status

ULGEN is currently in foundation stage.

The repository is set up for structured development, but the product is not yet feature-complete.
