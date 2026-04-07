use std::fs;
use std::path::PathBuf;
use tauri::Emitter;
use tauri::Manager;

// ── Settings type ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ClockSettings {
    font_family: String,
    font_size: f64,
    foreground_color: String,
    foreground_opacity: f64,
    background_color: String,
    background_opacity: f64,
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
            text_shadow: String::new(),
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
    Ok(roaming.join("Clock Overlay").join("settings.json"))
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
                .get_webview_window("main")
                .expect("main window not found");

            window.set_always_on_top(true)?;
            window.set_decorations(false)?;
            window.set_fullscreen(false)?;
            window.set_resizable(false)?;
            window.set_skip_taskbar(true)?;
            window.set_ignore_cursor_events(false)?;
            window.center()?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
