# Roadmap

## Foundation (Completed)

- Monorepo skeleton (Cargo & npm)
- Provider abstraction layer (`CloudProvider` trait)
- Cross-platform build & release (macOS/Windows/Linux)

## MVP: Local Cloud Control

- AWS credential onboarding (Secure local storage)
- Global EC2 inventory (Multi-region discovery)
- SSH terminal integration (In-app terminal)
- Rapid Security Group rule authorization

## Phase 2: Multi-Cloud Developer Toolkit (Next)

- **Provider Expansion**:
  - Google Cloud Platform (GCE) & Microsoft Azure (VM) support
  - Unified lifecycle controls (Start/Stop/Reboot) across all clouds
- **Cross-Cloud Security Audit**: 
  - Visual analysis of AWS Security Groups, GCP Firewall Rules, and Azure NSGs
  - Intelligent risk scoring (e.g., world-readable management ports)
- **Universal Performance Metrics**:
  - Unified CPU/Memory/Disk usage dashboard
  - Hybrid data collection (Cloud-native APIs + SSH-based real-time stats)
- **DevOps Utility Suite**:
  - Drag-and-drop file transfers (SCP/SFTP bridge)
  - One-click public IP assignment/release
  - Machine image (AMI/Snapshot) management

## Phase 3: Infrastructure Intelligence

- **Cost Optimization**: Real-time hourly burn rates and idle resource detection
- **Local Persistence**: Full offline capability with background sync
- **Graph Explorer**: Visualize dependencies (Instance -> Volume -> Network)
- **Shared Context**: Optional team sync for collaborative infrastructure metadata
