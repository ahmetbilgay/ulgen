// Forced rebuild for capability synchronization
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use std::collections::HashMap;
use std::sync::Arc;

use tauri::{Manager, State, Emitter};
use tauri_plugin_dialog::DialogExt;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::process::{Child, ChildStdin, Command};
use tokio::sync::Mutex;
use ulgen_api_proto::{
    AwsConnectionStatus, AwsCredentialInput, AwsCredentialSummary, DiscoveryResult, InstanceSummary,
    ResourceMetrics, SecurityGroupSummary,
};
use ulgen_core::{AwsProvider, CloudProvider, SecurityGroupRule, vault::SecretVault};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;
#[cfg(target_os = "macos")]
use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};

const AWS_CREDENTIALS_KEY: &str = "aws-credentials";
const PROFILES_LIST_KEY: &str = "cloud-profiles";

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct CloudProfile {
    name: String,
    provider: String, // "aws", etc.
    preview: String,
    default_region: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
struct NodeCredential {
    username: String,
    key_path: Option<String>,
}

const NODE_CREDENTIALS_KEY: &str = "node-credentials";

#[derive(serde::Serialize, Clone)]
struct TerminalOutputPayload {
    sid: u64,
    data: String,
}

#[derive(Default)]
struct AppState {
    next_terminal_id: std::sync::atomic::AtomicU64,
    terminal_sessions: Mutex<HashMap<u64, Arc<TerminalSession>>>,
}

struct TerminalSession {
    child: Mutex<Child>,
    stdin: Mutex<Option<ChildStdin>>,
    running: Arc<std::sync::atomic::AtomicBool>,
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

async fn create_terminal_session(
    app_handle: tauri::AppHandle,
    session_id: u64,
    command: &str, 
    args: &[String]
) -> Result<TerminalSession> {
    let mut child = Command::new(command)
        .args(args)
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()?;

    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    let stdin = child.stdin.take();

    let running = Arc::new(std::sync::atomic::AtomicBool::new(true));

    if let Some(mut stdout) = stdout {
        let app = app_handle.clone();
        let r = running.clone();
        tokio::spawn(async move {
            println!("[Terminal {}] Monitoring stdout...", session_id);
            let mut chunk = [0u8; 4096];
            loop {
                match stdout.read(&mut chunk).await {
                    Ok(0) => {
                        println!("[Terminal {}] stdout closed.", session_id);
                        r.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                    Ok(read) => {
                        let data = String::from_utf8_lossy(&chunk[..read]).to_string();
                        println!("[Terminal {}] Read {} bytes", session_id, read);
                        let payload = TerminalOutputPayload { sid: session_id, data };
                        if let Err(e) = app.emit("terminal-output", payload) {
                            println!("[Terminal {}] Emit error: {:?}", session_id, e);
                        }
                    }
                    Err(e) => {
                        println!("[Terminal {}] stdout error: {}", session_id, e);
                        r.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                }
            }
        });
    }

    if let Some(mut stderr) = stderr {
        let app = app_handle.clone();
        let r = running.clone();
        tokio::spawn(async move {
            println!("[Terminal {}] Monitoring stderr...", session_id);
            let mut chunk = [0u8; 4096];
            loop {
                match stderr.read(&mut chunk).await {
                    Ok(0) => {
                        println!("[Terminal {}] stderr closed.", session_id);
                        r.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                    Ok(read) => {
                        let data = String::from_utf8_lossy(&chunk[..read]).to_string();
                        println!("[Terminal {}] Stderr: {}", session_id, data);
                        let payload = TerminalOutputPayload { sid: session_id, data };
                        if let Err(e) = app.emit("terminal-output", payload) {
                            println!("[Terminal {}] Emit error: {:?}", session_id, e);
                        }
                    }
                    Err(e) => {
                        println!("[Terminal {}] stderr error: {}", session_id, e);
                        r.store(false, std::sync::atomic::Ordering::Relaxed);
                        break;
                    }
                }
            }
        });
    }

    Ok(TerminalSession {
        child: Mutex::new(child),
        stdin: Mutex::new(stdin),
        running,
    })
}

#[tauri::command]
fn load_aws_credentials() -> Result<AwsCredentialSummary, String> {
    match load_saved_credentials() {
        Ok(credentials) => Ok(AwsCredentialSummary {
            is_configured: true,
            account_name: Some(credentials.account_name),
            access_key_preview: Some(credential_preview(&credentials.access_key_id)),
            default_region: Some(credentials.default_region),
        }),
        Err(_) => Ok(AwsCredentialSummary {
            is_configured: false,
            account_name: None,
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
        account_name: Some(input.account_name),
        access_key_preview: Some(credential_preview(&input.access_key_id)),
        default_region: Some(input.default_region),
    })
}

#[tauri::command]
fn list_cloud_profiles() -> Result<Vec<CloudProfile>, String> {
    let mut profiles = match SecretVault::load_json::<Vec<CloudProfile>>(PROFILES_LIST_KEY) {
        Ok(p) => p,
        Err(_) => Vec::new(),
    };
    
    // If no profiles exist but there are active credentials, backfill the first profile
    if profiles.is_empty() {
        if let Ok(creds) = load_saved_credentials() {
            let preview = credential_preview(&creds.access_key_id);
            let profile = CloudProfile {
                name: creds.account_name.clone(),
                provider: "aws".to_string(),
                preview,
                default_region: creds.default_region.clone(),
            };
            profiles.push(profile);
            // Persist the backfilled profile list
            let _ = SecretVault::store_json(PROFILES_LIST_KEY, &profiles);
            
            // Also ensure the full creds are saved in the profile secret key
            let secret_key = format!("profile-{}", creds.account_name);
            let _ = SecretVault::store_json(&secret_key, &creds);
        }
    }
    
    Ok(profiles)
}

#[tauri::command]
fn save_cloud_profile(input: AwsCredentialInput) -> Result<CloudProfile, String> {
    let mut profiles = list_cloud_profiles()?;
    let preview = credential_preview(&input.access_key_id);
    
    let profile = CloudProfile {
        name: input.account_name.clone(),
        provider: "aws".to_string(),
        preview: preview.clone(),
        default_region: input.default_region.clone(),
    };

    // Update or add
    if let Some(existing) = profiles.iter_mut().find(|p| p.name == input.account_name) {
        *existing = profile.clone();
    } else {
        profiles.push(profile.clone());
    }

    SecretVault::store_json(PROFILES_LIST_KEY, &profiles).map_err(|e| e.to_string())?;
    
    // Also store the full credentials in a specific profile file
    let secret_key = format!("profile-{}", input.account_name);
    SecretVault::store_json(&secret_key, &input).map_err(|e| e.to_string())?;

    Ok(profile)
}

#[tauri::command]
async fn open_pem_dialog(app: tauri::AppHandle) -> Result<Option<String>, String> {
    let file = app
        .dialog()
        .file()
        .add_filter("PEM Keys", &["pem", "key"])
        .blocking_pick_file();

    Ok(file.map(|f| f.to_string()))
}

#[tauri::command]
async fn fetch_aws_regions() -> Result<Vec<String>, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);
    provider.list_regions().await.map_err(|error| error.to_string())
}

#[tauri::command]
fn switch_cloud_profile(name: String) -> Result<AwsCredentialSummary, String> {
    let secret_key = format!("profile-{}", name);
    let credentials = SecretVault::load_json::<AwsCredentialInput>(&secret_key)
        .map_err(|_| format!("Profile '{}' not found or corrupted.", name))?;

    // Set as active
    save_aws_credentials(credentials)
}

#[tauri::command]
fn delete_cloud_profile(name: String) -> Result<(), String> {
    let mut profiles = list_cloud_profiles()?;
    profiles.retain(|p| p.name != name);
    SecretVault::store_json(PROFILES_LIST_KEY, &profiles).map_err(|e| e.to_string())?;
    
    let secret_key = format!("profile-{}", name);
    let _ = SecretVault::delete(&secret_key);
    Ok(())
}

#[tauri::command]
fn clear_aws_credentials() -> Result<(), String> {
    SecretVault::delete(AWS_CREDENTIALS_KEY).map_err(|error| error.to_string())
}

#[tauri::command]
fn load_node_credentials() -> Result<HashMap<String, NodeCredential>, String> {
    SecretVault::load_json(NODE_CREDENTIALS_KEY).map_err(|e| e.to_string())
}

#[tauri::command]
fn save_node_credentials(
    credentials: HashMap<String, NodeCredential>,
) -> Result<(), String> {
    SecretVault::store_json(NODE_CREDENTIALS_KEY, &credentials).map_err(|e| e.to_string())
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
async fn fetch_instances(region: Option<String>) -> Result<DiscoveryResult, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .fetch_instances(region)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn open_terminal_session(
    app: tauri::AppHandle,
    app_state: State<'_, AppState>,
    instance: InstanceSummary,
    username: String,
    private_key_path: Option<String>,
) -> Result<u64, String> {
    let host = instance
        .public_ip
        .clone()
        .or(instance.private_ip.clone())
        .ok_or_else(|| "Selected instance does not expose a reachable IP.".to_owned())?;

    let mut args = vec![
        "-tt".to_owned(),
        "-o".to_owned(),
        "StrictHostKeyChecking=no".to_owned(),
    ];

    if let Some(path) = private_key_path {
        args.push("-i".to_owned());
        args.push(path);
    }

    args.push(format!("{username}@{host}"));

    let session_id = app_state
        .next_terminal_id
        .fetch_add(1, std::sync::atomic::Ordering::Relaxed)
        + 1;

    let session = create_terminal_session(app, session_id, "ssh", &args)
        .await
        .map_err(|error| error.to_string())?;

    app_state
        .terminal_sessions
        .lock()
        .await
        .insert(session_id, Arc::new(session));

    Ok(session_id)
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
async fn reboot_instance(region: String, instance_id: String) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .reboot_instance(&region, &instance_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn fetch_instance_security_groups(
    region: String,
    instance_id: String,
) -> Result<Vec<SecurityGroupSummary>, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .fetch_security_groups(&region, &instance_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn list_all_security_groups(region: String) -> Result<Vec<SecurityGroupSummary>, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .list_all_security_groups(&region)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn authorize_security_group_ingress(
    region: String,
    security_group_id: String,
    rule: SecurityGroupRule,
) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .authorize_ip(&region, &security_group_id, rule)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn revoke_security_group_ingress(
    region: String,
    security_group_id: String,
    rule: SecurityGroupRule,
) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .revoke_ip(&region, &security_group_id, rule)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn create_security_group(
    region: String,
    name: String,
    description: String,
) -> Result<String, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .create_security_group(&region, &name, &description)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn delete_security_group(region: String, security_group_id: String) -> Result<(), String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .delete_security_group(&region, &security_group_id)
        .await
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn fetch_instance_metrics(
    region: String,
    instance_id: String,
) -> Result<ResourceMetrics, String> {
    let credentials = load_saved_credentials().map_err(|error| error.to_string())?;
    let provider = provider_from_input(&credentials);

    provider
        .fetch_metrics(&region, &instance_id)
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
        .plugin(tauri_plugin_dialog::init())
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
            write_terminal_input,
            close_terminal_session,
            prepare_ssh_session,
            reboot_instance,
            fetch_instance_security_groups,
            list_all_security_groups,
            authorize_security_group_ingress,
            revoke_security_group_ingress,
            create_security_group,
            delete_security_group,
            fetch_instance_metrics,
            list_cloud_profiles,
            save_cloud_profile,
            switch_cloud_profile,
            delete_cloud_profile,
            open_pem_dialog,
            fetch_aws_regions,
            load_node_credentials,
            save_node_credentials
        ])
        .setup(|app| {
            // Initialize logging for development
            if let Err(e) = ulgen_core::logging::init_dev() {
                eprintln!("Failed to initialize logging: {e}");
            }

            if let Some(window) = app.get_webview_window("main") {
                apply_native_effects(&window);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run ULGEN desktop");
}
