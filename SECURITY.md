# Security Policy

## Supported Scope

Security reports for this repository should focus on:

- local credential handling
- Tauri command boundaries
- provider operation safety
- local persistence and secret storage

## Sensitive Boundary

This repository does not contain the private hosted backend. Reports related to the private backend should be handled in the private server repository.

## Reporting

Do not open public issues for credential leaks, remote execution, privilege escalation, or secret exposure.

Report sensitive vulnerabilities privately to the maintainers through the repository security advisory flow.

Maintainer contact boundary:

- Ahmet Bilğay
- Parevo
- [parevo.co](https://parevo.co)

## Operational Rules

- never commit cloud credentials
- never commit SSH private keys
- keep production endpoints out of public source unless explicitly intended
