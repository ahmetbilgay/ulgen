# Security Model

## Core Rules

- provider credentials must be stored in local secure storage
- the frontend must use Tauri commands and core abstractions, not raw cloud SDK access
- private backend logic must remain outside this repository

## Public Repository Constraints

- no production secrets
- no internal-only service code
- no hosted auth implementation
