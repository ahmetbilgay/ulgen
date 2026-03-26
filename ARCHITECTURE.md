# Architecture

## Overview

ULGEN is split into a local desktop runtime and a provider-focused Rust core.

```text
React UI -> Tauri Commands -> ulgen-core -> Cloud Provider SDKs
                                |
                                +-> vault
                                +-> db
                                +-> ssh
```

## Open-Source Packages

### `packages/ulgen-core`

Responsibilities:

- provider abstraction via `CloudProvider`
- AWS discovery and operations
- local secret storage integration
- local state persistence
- SSH and terminal orchestration

Rules:

- UI must not talk directly to AWS SDKs
- provider implementations stay behind traits
- cloud credentials stay local

### `packages/ulgen-desktop`

Responsibilities:

- desktop shell with Tauri
- React-based local UI
- native desktop integration
- invoking core commands

### `packages/ulgen-api-proto`

Responsibilities:

- public shared types
- sync-safe data contracts
- stable payloads across local and cloud-connected flows

## Private Boundary

The hosted cloud backend is intentionally excluded from this repository.

Recommended setup:

- public repo: `ulgen`
- private repo: `ulgen-server`

The private repo may consume `ulgen-api-proto`, but private server code must not be committed here.

## Data Boundaries

### Local-only

- AWS access keys
- AWS secret keys
- session tokens
- SSH private keys
- cached operational state

### Optional cloud sync

- UI preferences
- team metadata
- shared operational references

## Near-Term Milestones

1. Credential onboarding and keyring integration
2. Core operations bridge for start, stop, authorize, key management
3. Terminal and SSH runtime
4. Provider expansion and caching
