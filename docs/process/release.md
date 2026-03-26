# Release Process

## Versioning

Use semantic versioning:

- `MAJOR.MINOR.PATCH`

Examples:

- `v0.1.0`
- `v0.1.1`
- `v0.2.0`

## Release Flow

1. Make sure `npm run ci` passes locally.
2. Update changelog entries as needed.
3. Create and push a git tag in the form `v*`.
4. GitHub Actions `release.yml` builds desktop artifacts.
5. Review the generated draft release.
6. Publish the release after validating artifacts.

## Notes

- Private backend releases are out of scope for this repository.
- Desktop signing and notarization can be layered in later.
- Release artifacts come from the Tauri build pipeline.
