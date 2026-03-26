# AWS Provider Notes

## Current Focus

- EC2 discovery
- instance start and stop
- security group ingress authorization
- key pair creation and deletion

## Design Rules

- region scans should run concurrently
- provider errors should remain actionable
- state returned to the UI should be normalized
