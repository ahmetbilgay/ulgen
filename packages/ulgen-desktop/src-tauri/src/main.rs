#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;

use tauri::{Manager, State};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::Mutex;
use ulgen_api_proto::{
    AwsConnectionStatus, AwsCredentialInput, AwsCredentialSummary, DiscoveryResult, InstanceSummary,
};
use ulgen_core::{AwsProvider, CloudProvider, vault::SecretVault};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;
#[cfg(target_os = "macos")]
use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};

const AWS_CREDENTIALS_KEY: &str = "aws-credentials";

#[derive(Default)]
struct AppState {
    next_terminal_id: std::sync::atomic::AtomicU64,
    terminal_sessions: Mutex<HashMap<u64, Arc<TerminalSession>>>,
}

struct TerminalSession {
    child: Mutex<Child>,
    stdin: Mutex<Option<ChildStdin>>,
    buffer: Arc<Mutex<Vec<u8>>>,
    running: Arc<std::sync::atomic::AtomicBool>,
}

#[derive(serde::Serialize)]
struct TerminalSnapshot {
    output: String,
    cursor: usize,
    running: bool,
}

fn load_saved_credentials() -> Result<AwsCredentialInput> {
    SecretVault::load_json(AWS_CREDENTIALS_KEY)
}

fn credential_preview(access_key_id: &str) -> String {
    let start = access_key_id.chars().take(4).collect::<String>();
    let end = access_key_id
        .chars()
        .rev()
        .take(4)
        .collect::<String>()
        .chars()
        .rev()
        .collect::<String>();
    format!("{start}••••{end}")
}

fn provider_from_input(input: &AwsCredentialInput) -> AwsProvider {
    AwsProvider::with_credentials(
        input.default_region.clone(),
        input.access_key_id.clone(),
        input.secret_access_key.clone(),
        input.session_token.clone(),
    )
}

async fn create_terminal_session(command: &str, args: &[String]) -> Result<TerminalSession> {
    let mut child = Command::new(command)
        .args(args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let stdin = child.stdin.take();

    let session = TerminalSession {
        child: Mutex::new(child),
        stdin: Mutex::new(stdin),
        buffer: Arc::new(Mutex::new(Vec::new())),
        running: Arc::new(std::sync::atomic::AtomicBool::new(true)),
    };

    if let Some(mut stdout) = stdout {
        let buffer = session.buffer.clone();
        let running = session.running.clone();
        tokio::spawn(async move {
            let mut chunk = [0u8; 4096];
            loop {
                match stdout.read(&mut chunk).await {
                    Ok(0) => {
                        running.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                    Ok(read) => {
                        buffer.lock().await.extend_from_slice(&chunk[..read]);
                    }
                    Err(_) => {
                        running.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                }
            }
        });
    }

    if let Some(mut stderr) = stderr {
        let buffer = session.buffer.clone();
        let running = session.running.clone();
        tokio::spawn(async move {
            let mut chunk = [0u8; 4096];
            loop {
                match stderr.read(&mut chunk).await {
                    Ok(0) => {
                        running.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                    Ok(read) => {
                        buffer.lock().await.extend_from_slice(&chunk[..read]);
                    }
                    Err(_) => {
                        running.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                }
            }
        });
    }

    Ok(session)
}

#[tauri::command]
fn load_aws_credentials() -> Result<AwsCredentialSummary, String> {
    match load_saved_credentials() {
        Ok(credentials) => Ok(AwsCredentialSummary {
            is_configured: true,
            access_key_preview: Some(credential_preview(&credentials.access_key_id)),
            default_region: Some(credentials.default_region),
        }),
        Err(_) => Ok(AwsCredentialSummary {
            is_configured: false,
            access_key_preview: None,
            default_region: None,
        }),
    }
}

#[tauri::command]
fn save_aws_credentials(input: AwsCredentialInput) -> Result<AwsCredentialSummary, String> {
    SecretVault::store_json(AWS_CREDENTIALS_KEY, &input).map_err(|error| error.to_string())?;

    Ok(AwsCredentialSummary {
        is_configured: true,
        access_key_preview: Some(credential_preview(&input.access_key_id)),
        default_region: Some(input.default_region),
    })
}

#[tauri::command]
fn clear_aws_credentials() -> Result<(), String> {
    SecretVault::delete(AWS_CREDENTIALS_KEY).map_err(|error| error.to_string())
}

#[tauri::command]
async fn test_aws_connection(
    input: Option<AwsCredentialInput>,
) -> Result<AwsConnectionStatus, String> {
    let credentials = match input {
        Some(input) => input,
        None => load_saved_credentials().map_err(|error| error.to_string())?,
    };

    let provider = provider_from_input(&credentials);
    let regions = provider
        .list_regions()
        .await
        .map_err(|error| error.to_string())?;

    Ok(AwsConnectionStatus {
        ok: true,
        message: format!("Connected to AWS. {} region(s) discovered.", regions.len()),
        region_count: regions.len(),
    })
}

#[tauri::command]
async fn fetch_instances() -> Result<DiscoveryResult, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .fetch_instances()
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn open_terminal_session(
    app_state: State<'_, AppState>,
    instance: InstanceSummary,
    username: String,
) -> Result<u64, String> {
    let host = instance
        .public_ip
        .clone()
        .or(instance.private_ip.clone())
        .ok_or_else(|| "Selected instance does not expose a reachable IP.".to_owned())?;

    let args = vec![
        "-tt".to_owned(),
        "-o".to_owned(),
        "StrictHostKeyChecking=no".to_owned(),
        format!("{username}@{host}"),
    ];

    let session = create_terminal_session("ssh", &args)
        .await
        .map_err(|error| error.to_string())?;

    let session_id = app_state
        .next_terminal_id
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        + 1;

    app_state
        .terminal_sessions
        .lock()
        .await
        .insert(session_id, Arc::new(session));

    Ok(session_id)
}

#[tauri::command]
async fn read_terminal_output(
    app_state: State<'_, AppState>,
    session_id: u64,
    cursor: usize,
) -> Result<TerminalSnapshot, String> {
    let sessions = app_state.terminal_sessions.lock().await;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "Terminal session not found.".to_owned())?
        .clone();
    drop(sessions);

    let buffer = session.buffer.lock().await;
    let next_cursor = buffer.len();
    let output = String::from_utf8_lossy(buffer.get(cursor..).unwrap_or_default()).to_string();

    Ok(TerminalSnapshot {
        output,
        cursor: next_cursor,
        running: session.running.load(std::sync::atomic::Ordering::Relaxed),
    })
}

#[tauri::command]
async fn write_terminal_input(
    app_state: State<'_, AppState>,
    session_id: u64,
    input: String,
) -> Result<(), String> {
    let sessions = app_state.terminal_sessions.lock().await;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "Terminal session not found.".to_owned())?
        .clone();
    drop(sessions);

    let mut stdin = session.stdin.lock().await;
    let writer = stdin
        .as_mut()
        .ok_or_else(|| "Terminal stdin is unavailable.".to_owned())?;

    writer
        .write_all(input.as_bytes())
        .await
        .map_err(|error| error.to_string())?;
    writer
        .write_all(b"\n")
        .await
        .map_err(|error| error.to_string())?;
    writer.flush().await.map_err(|error| error.to_string())
}

#[tauri::command]
async fn close_terminal_session(
    app_state: State<'_, AppState>,
    session_id: u64,
) -> Result<(), String> {
    let session = app_state.terminal_sessions.lock().await.remove(&session_id);

    if let Some(session) = session {
        session
            .running
            .store(false, std::sync::atomic::Ordering::Relaxed);
        let mut child = session.child.lock().await;
        child.kill().await.map_err(|error| error.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn start_instance(region: String, instance_id: String) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .start_instance(&region, &instance_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn stop_instance(region: String, instance_id: String) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .stop_instance(&region, &instance_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn prepare_ssh_session(instance: InstanceSummary, username: String) -> Result<String, String> {
    let host = instance
        .public_ip
        .clone()
        .or(instance.private_ip.clone())
        .ok_or_else(|| "Selected instance does not expose a reachable IP.".to_owned())?;

    Ok(format!("ssh {username}@{host}"))
}

fn apply_native_effects(_window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    let _ = apply_vibrancy(_window, NSVisualEffectMaterial::HudWindow, None, None);

    #[cfg(target_os = "windows")]
    let _ = apply_mica(_window, None);
}

fn main() {
    tauri::Builder::default()
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            load_aws_credentials,
            save_aws_credentials,
            clear_aws_credentials,
            test_aws_connection,
            fetch_instances,
            start_instance,
            stop_instance,
            open_terminal_session,
            read_terminal_output,
            write_terminal_input,
            close_terminal_session,
            prepare_ssh_session
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                apply_native_effects(&window);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run ULGEN desktop");
}
