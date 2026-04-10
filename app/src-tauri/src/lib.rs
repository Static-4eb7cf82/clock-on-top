use std::fs;
use std::path::PathBuf;
use tauri::Emitter;
use tauri::Manager;

// ── Settings type ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct ClockSettings {
    font_family: String,
    font_size: f64,
    foreground_color: String,
    foreground_opacity: f64,
    background_color: String,
    background_opacity: f64,
    border_radius: f64,
    text_shadow: String,
    padding_vertical: String,
    padding_horizontal: String,
}

impl Default for ClockSettings {
    fn default() -> Self {
        ClockSettings {
            font_family: "Space Grotesk".to_string(),
            font_size: 26.0,
            foreground_color: "#ffffff".to_string(),
            foreground_opacity: 0.9,
            background_color: "#000000".to_string(),
            background_opacity: 0.2,
            border_radius: 8.0,
            text_shadow: "1px 1px 3px rgba(0,0,0,0.9)".to_string(),
            padding_vertical: "0em".to_string(),
            padding_horizontal: "0.2em".to_string(),
        }
    }
}

fn settings_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let base = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let roaming = base
        .parent()
        .ok_or_else(|| "Cannot determine AppData\\Roaming directory".to_string())?;
    Ok(roaming.join("Clock On Top").join("settings.json"))
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn resize_window(window: tauri::WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn read_settings(app: tauri::AppHandle) -> Result<ClockSettings, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(ClockSettings::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_settings(app: tauri::AppHandle, settings: ClockSettings) -> Result<(), String> {
    let path = settings_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;
    app.emit("settings-updated", &settings)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("settings")
        .ok_or_else(|| "settings window not found".to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

#[tauri::command]
fn close_settings_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            resize_window,
            read_settings,
            write_settings,
            open_settings_window,
            close_settings_window,
        ])
        .setup(|app| {
            let window = app
                .get_webview_window("clock")
                .expect("clock window not found");

            window.center()?;

            // ── System tray ───────────────────────────────────────────────────
            let settings_item =
                tauri::menu::MenuItemBuilder::with_id("settings", "Settings").build(app)?;
            let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
            let quit_item =
                tauri::menu::MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = tauri::menu::MenuBuilder::new(app)
                .item(&settings_item)
                .item(&separator)
                .item(&quit_item)
                .build()?;

            tauri::tray::TrayIconBuilder::new()
                .menu(&menu)
                .icon(tauri::include_image!("icons/32x32.png"))
                .tooltip("Clock On Top")
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "settings" => {
                        if let Some(w) = app.get_webview_window("settings") {
                            let _ = w.show();
                            let _ = w.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
