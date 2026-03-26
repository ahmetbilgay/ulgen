use anyhow::Result;

#[derive(Debug, Clone)]
pub struct SshSessionRequest {
    pub host: String,
    pub username: String,
    pub private_key_pem: String,
}

#[derive(Debug, Clone)]
pub struct SshTunnelDescriptor {
    pub local_port: u16,
    pub remote_host: String,
    pub remote_port: u16,
}

pub async fn open_terminal_session(_request: SshSessionRequest) -> Result<()> {
    Ok(())
}

pub async fn open_tunnel(_descriptor: SshTunnelDescriptor) -> Result<()> {
    Ok(())
}
