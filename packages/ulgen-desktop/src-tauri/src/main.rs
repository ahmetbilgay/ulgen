#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use anyhow::Result;
use tauri::Manager;
use ulgen_api_proto::{
    AwsConnectionStatus, AwsCredentialInput, AwsCredentialSummary, DiscoveryResult, InstanceSummary,
};
use ulgen_core::{AwsProvider, CloudProvider, vault::SecretVault};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;
#[cfg(target_os = "macos")]
use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};

const AWS_CREDENTIALS_KEY: &str = "aws-credentials";

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
        .invoke_handler(tauri::generate_handler![
            load_aws_credentials,
            save_aws_credentials,
            clear_aws_credentials,
            test_aws_connection,
            fetch_instances,
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
