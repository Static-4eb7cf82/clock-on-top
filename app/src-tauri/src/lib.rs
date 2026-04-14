use std::fs;
use std::path::PathBuf;
use tauri::webview::PageLoadEvent;
use tauri::Emitter;
use tauri::Manager;
use tauri::WebviewWindow;
use tauri::WebviewWindowBuilder;
use tauri_plugin_autostart::ManagerExt as AutostartManagerExt;
use tauri_plugin_updater::UpdaterExt;

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
            text_shadow: "1px 1px 3px rgba(0,0,0,0.5)".to_string(),
            padding_vertical: "0em".to_string(),
            padding_horizontal: "0.2em".to_string(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct GeneralSettings {
    enable_automatic_updates: bool,
    launch_on_startup: bool,
    app_theme: String,
}

impl Default for GeneralSettings {
    fn default() -> Self {
        GeneralSettings {
            enable_automatic_updates: true,
            launch_on_startup: true,
            app_theme: "system".to_string(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct SettingsFile {
    general: GeneralSettings,
    clock: ClockSettings,
}

impl Default for SettingsFile {
    fn default() -> Self {
        SettingsFile {
            general: GeneralSettings::default(),
            clock: ClockSettings::default(),
        }
    }
}

fn settings_path(_app: &tauri::AppHandle) -> Result<PathBuf, String> {
    let home_dir = dirs::home_dir().ok_or_else(|| "Cannot determine home directory".to_string())?;
    Ok(home_dir.join(".clockontop").join("settings.json"))
}

fn show_and_focus_window(window: &WebviewWindow) -> Result<(), String> {
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())
}

// Recreate auxiliary windows from tauri.conf.json so the runtime behavior stays
// aligned with config instead of duplicating window options in Rust.
fn create_aux_window_from_config(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    let window_config = app
        .config()
        .app
        .windows
        .iter()
        .find(|window| window.label == label)
        .ok_or_else(|| format!("window config not found for label: {label}"))?;

    WebviewWindowBuilder::from_config(app, window_config)
        .map_err(|e| e.to_string())?
        // Newly created windows can briefly flash white on Windows if they are
        // shown before the first webview paint completes, so keep them hidden
        // until the initial page load finishes.
        .on_page_load(|window, payload| {
            if payload.event() == PageLoadEvent::Finished {
                let should_show = window.is_visible().map(|visible| !visible).unwrap_or(true);
                if should_show {
                    let _ = show_and_focus_window(&window);
                }
            }
        })
        .build()
        .map(|_| ())
        .map_err(|e| e.to_string())
}

// Reuse an existing auxiliary window when possible; otherwise recreate it and
// let the page-load hook reveal it once the webview is ready.
fn open_aux_window(app: &tauri::AppHandle, label: &str) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(label) {
        return show_and_focus_window(&window);
    }

    create_aux_window_from_config(app, label)
}

async fn check_for_updates(app_handle: tauri::AppHandle, enable_automatic_updates: bool) -> bool {
    let app_version = app_handle.package_info().version.to_string();
    println!("Current app version: {app_version}");

    if !enable_automatic_updates {
        println!("Automatic updates are not enabled; not checking if update is available");
        return false;
    }

    println!("Checking for update");

    let updater = match app_handle.updater() {
        Ok(updater) => updater,
        Err(error) => {
            println!("ERROR Failed to initialize updater: {error}");
            return false;
        }
    };

    let update = match updater.check().await {
        Ok(update) => update,
        Err(error) => {
            println!("ERROR Automatic update check failed: {error}");
            return false;
        }
    };

    let Some(update) = update else {
        println!("No update found, starting app normally");
        return false;
    };

    println!(
        "Update found. Downloading and installing new version {}",
        update.version
    );

    if let Err(error) = update.download_and_install(|_, _| {}, || {}).await {
        println!("ERROR Automatic update install failed: {error}");
        return false;
    }

    println!("Restarting");
    tauri::async_runtime::spawn(async move {
        app_handle.restart();
    });
    true
}

fn setup_system_tray(app: &tauri::App) -> tauri::Result<()> {
    let about_clock_item =
        tauri::menu::MenuItemBuilder::with_id("about_window", "About Clock On Top...")
            .build(app)?;
    let report_bug_item =
        tauri::menu::MenuItemBuilder::with_id("report_bug", "Report a Bug...").build(app)?;
    let more_submenu = tauri::menu::SubmenuBuilder::new(app, "More")
        .item(&about_clock_item)
        .item(&report_bug_item)
        .build()?;
    let settings_item = tauri::menu::MenuItemBuilder::with_id("settings", "Settings").build(app)?;
    let separator = tauri::menu::PredefinedMenuItem::separator(app)?;
    let quit_item = tauri::menu::MenuItemBuilder::with_id("quit", "Quit").build(app)?;
    let menu = tauri::menu::MenuBuilder::new(app)
        .item(&settings_item)
        .item(&separator)
        .item(&more_submenu)
        .item(&separator)
        .item(&quit_item)
        .build()?;

    tauri::tray::TrayIconBuilder::new()
        .menu(&menu)
        .icon(tauri::include_image!("icons/32x32.png"))
        .tooltip("Clock On Top")
        .on_menu_event(|app, event| match event.id().as_ref() {
            "settings" => {
                let _ = open_aux_window(app, "settings");
            }
            "about_window" => {
                let _ = open_aux_window(app, "about");
            }
            "report_bug" => {
                use tauri_plugin_opener::OpenerExt;
                let _ = app.opener().open_url(
                    "https://github.com/Static-4eb7cf82/clock-on-top/issues",
                    None::<&str>,
                );
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}

// ── Commands ──────────────────────────────────────────────────────────────────

#[tauri::command]
fn resize_window(window: tauri::WebviewWindow, width: f64, height: f64) -> Result<(), String> {
    window
        .set_size(tauri::Size::Logical(tauri::LogicalSize { width, height }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn read_settings(app: tauri::AppHandle) -> Result<SettingsFile, String> {
    let path = settings_path(&app)?;
    if !path.exists() {
        return Ok(SettingsFile::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str::<SettingsFile>(&content).map_err(|e| e.to_string())
}

#[tauri::command]
fn write_settings(app: tauri::AppHandle, settings: SettingsFile) -> Result<(), String> {
    let path = settings_path(&app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;

    if let Err(error) = apply_launch_on_startup(&app, settings.general.launch_on_startup) {
        println!("WARN Failed to set launch on startup: {error}");
    }

    app.emit("settings-updated", &settings)
        .map_err(|e| e.to_string())
}

fn apply_launch_on_startup(app: &tauri::AppHandle, launch_on_startup: bool) -> Result<(), String> {
    let autolaunch = app.autolaunch();
    if launch_on_startup {
        autolaunch.enable().map_err(|e| e.to_string())
    } else {
        autolaunch.disable().map_err(|e| e.to_string())
    }
}

fn is_valid_hex_color(color: &str) -> bool {
    let s = color.trim();
    if !s.starts_with('#') {
        return false;
    }
    let hex = &s[1..];
    matches!(hex.len(), 3 | 6 | 8) && hex.chars().all(|ch| ch.is_ascii_hexdigit())
}

fn validate_settings(app: &tauri::AppHandle) -> Result<SettingsFile, String> {
    let path = settings_path(app)?;
    let defaults = SettingsFile::default();

    let mut settings = if path.exists() {
        let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

        if let Ok(s) = serde_json::from_str::<SettingsFile>(&content) {
            s
        } else {
            println!("WARN Settings file could not be parsed, resetting to defaults");
            SettingsFile::default()
        }
    } else {
        println!("Settings file not found, creating with defaults");
        SettingsFile::default()
    };

    // Validate and repair individual clock settings.
    if settings.clock.font_family.trim().is_empty() {
        settings.clock.font_family = defaults.clock.font_family;
    }
    if settings.clock.font_size <= 0.0 || !settings.clock.font_size.is_finite() {
        settings.clock.font_size = defaults.clock.font_size;
    }
    if !is_valid_hex_color(&settings.clock.foreground_color) {
        settings.clock.foreground_color = defaults.clock.foreground_color;
    }
    if !(0.0..=1.0).contains(&settings.clock.foreground_opacity)
        || !settings.clock.foreground_opacity.is_finite()
    {
        settings.clock.foreground_opacity = defaults.clock.foreground_opacity;
    }
    if !is_valid_hex_color(&settings.clock.background_color) {
        settings.clock.background_color = defaults.clock.background_color;
    }
    if !(0.0..=1.0).contains(&settings.clock.background_opacity)
        || !settings.clock.background_opacity.is_finite()
    {
        settings.clock.background_opacity = defaults.clock.background_opacity;
    }
    if settings.clock.border_radius < 0.0 || !settings.clock.border_radius.is_finite() {
        settings.clock.border_radius = defaults.clock.border_radius;
    }

    // Persist the validated (and potentially repaired) settings.
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())?;

    println!(
        "Current Settings: {}",
        serde_json::to_string(&settings).unwrap_or_else(|_| "<serialization error>".to_string())
    );

    Ok(settings)
}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    open_aux_window(&app, "settings")
}

#[tauri::command]
fn close_settings_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

#[tauri::command]
fn open_about_window(app: tauri::AppHandle) -> Result<(), String> {
    open_aux_window(&app, "about")
}

#[tauri::command]
fn close_about_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

// ── Entry point ───────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None::<Vec<&str>>,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            resize_window,
            read_settings,
            write_settings,
            open_settings_window,
            close_settings_window,
            open_about_window,
            close_about_window,
        ])
        .setup(|app| {
            let settings = validate_settings(app.handle()).unwrap_or_else(|error| {
                println!("ERROR Failed to validate settings, using defaults: {error}");
                SettingsFile::default()
            });

            if let Err(error) =
                apply_launch_on_startup(app.handle(), settings.general.launch_on_startup)
            {
                println!("WARN Failed to apply launch on startup setting: {error}");
            }

            let enable_automatic_updates = settings.general.enable_automatic_updates;

            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                let performing_update =
                    check_for_updates(app_handle.clone(), enable_automatic_updates).await;
                if !performing_update {
                    if let Some(clock_window) = app_handle.get_webview_window("clock") {
                        let _ = clock_window.center();
                        let _ = clock_window.show();
                    }
                }
            });

            setup_system_tray(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
