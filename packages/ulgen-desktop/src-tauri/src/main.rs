#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Arc;

use tauri::Manager;
use ulgen_api_proto::DiscoveryResult;
use ulgen_core::{AwsProvider, CloudProvider};

#[cfg(target_os = "windows")]
use window_vibrancy::apply_mica;
#[cfg(target_os = "macos")]
use window_vibrancy::{NSVisualEffectMaterial, apply_vibrancy};

#[derive(Clone)]
struct AppState {
    provider: Arc<AwsProvider>,
}

#[tauri::command]
async fn fetch_instances(state: tauri::State<'_, AppState>) -> Result<DiscoveryResult, String> {
    state
        .provider
        .fetch_instances()
        .await
        .map_err(|error| error.to_string())
}

fn apply_native_effects(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "macos")]
    let _ = apply_vibrancy(window, NSVisualEffectMaterial::HudWindow, None, None);

    #[cfg(target_os = "windows")]
    let _ = apply_mica(window, None);
}

fn main() {
    tauri::Builder::default()
        .manage(AppState {
            provider: Arc::new(AwsProvider::default()),
        })
        .invoke_handler(tauri::generate_handler![fetch_instances])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                apply_native_effects(&window);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run ULGEN desktop");
}
