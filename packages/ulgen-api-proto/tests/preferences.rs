use ulgen_api_proto::UiPreferences;

#[test]
fn default_preferences_enable_command_palette() {
    let preferences = UiPreferences::default();

    assert!(preferences.command_palette_enabled);
    assert!(!preferences.sidebar_collapsed);
}
