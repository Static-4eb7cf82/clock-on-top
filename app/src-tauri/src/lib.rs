use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::time::{Duration, SystemTime, UNIX_EPOCH};
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

#[derive(Debug, Clone, PartialEq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
enum ScheduleMode {
    Flash,
    BriefShow,
}

impl Default for ScheduleMode {
    fn default() -> Self {
        ScheduleMode::BriefShow
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct VisibilitySettings {
    fade_in_duration_ms: u64,
    fade_out_duration_ms: u64,
    scheduled_show_duration_seconds: u64,
    schedule_interval_minutes: u64,
    schedule_mode: ScheduleMode,
}

impl Default for VisibilitySettings {
    fn default() -> Self {
        VisibilitySettings {
            fade_in_duration_ms: 250,
            fade_out_duration_ms: 250,
            scheduled_show_duration_seconds: 60,
            schedule_interval_minutes: 0,
            schedule_mode: ScheduleMode::default(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase", default)]
struct SettingsFile {
    general: GeneralSettings,
    clock: ClockSettings,
    visibility: VisibilitySettings,
}

impl Default for SettingsFile {
    fn default() -> Self {
        SettingsFile {
            general: GeneralSettings::default(),
            clock: ClockSettings::default(),
            visibility: VisibilitySettings::default(),
        }
    }
}

struct VisibilityController {
    operation_generation: AtomicU64,
    suppress_schedules_until: AtomicU64,
    schedule_interval_minutes: AtomicU64,
    scheduled_show_duration_seconds: AtomicU64,
    brief_schedule: AtomicBool,
}

impl VisibilityController {
    fn new(settings: &SettingsFile) -> Self {
        VisibilityController {
            operation_generation: AtomicU64::new(0),
            suppress_schedules_until: AtomicU64::new(0),
            schedule_interval_minutes: AtomicU64::new(
                settings.visibility.schedule_interval_minutes,
            ),
            scheduled_show_duration_seconds: AtomicU64::new(
                settings.visibility.scheduled_show_duration_seconds,
            ),
            brief_schedule: AtomicBool::new(matches!(
                settings.visibility.schedule_mode,
                ScheduleMode::BriefShow
            )),
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

fn show_clock(app: &tauri::AppHandle) -> Result<u64, String> {
    let window = app
        .get_webview_window("clock")
        .ok_or_else(|| "clock window is not available".to_string())?;
    let already_visible = window.is_visible().unwrap_or(false);
    if !already_visible {
        window.show().map_err(|error| error.to_string())?;
    }
    let generation = app
        .state::<VisibilityController>()
        .operation_generation
        .fetch_add(1, Ordering::SeqCst)
        + 1;
    app.state::<VisibilityController>()
        .suppress_schedules_until
        .store(0, Ordering::SeqCst);
    app.emit("clock-show", already_visible)
        .map_err(|error| error.to_string())?;
    Ok(generation)
}

fn request_clock_hide(app: &tauri::AppHandle) -> Result<u64, String> {
    let generation = app
        .state::<VisibilityController>()
        .operation_generation
        .fetch_add(1, Ordering::SeqCst)
        + 1;
    if let Some(window) = app.get_webview_window("clock") {
        if window.is_visible().unwrap_or(false) {
            app.emit("clock-hide", ())
                .map_err(|error| error.to_string())?;
        }
    }
    Ok(generation)
}

fn hide_clock_for(app: &tauri::AppHandle, duration: Duration) {
    let generation = match request_clock_hide(app) {
        Ok(generation) => generation,
        Err(error) => {
            println!("ERROR Failed to hide clock: {error}");
            return;
        }
    };
    let deadline = unix_time_seconds().saturating_add(duration.as_secs());
    app.state::<VisibilityController>()
        .suppress_schedules_until
        .store(deadline, Ordering::SeqCst);

    let app_handle = app.clone();
    std::thread::spawn(move || {
        std::thread::sleep(duration);
        if app_handle
            .state::<VisibilityController>()
            .operation_generation
            .load(Ordering::SeqCst)
            == generation
        {
            if let Err(error) = show_clock(&app_handle) {
                println!("ERROR Failed to show clock after timed hide: {error}");
            }
        }
    });
}

fn unix_time_seconds() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

fn local_minute_mark() -> (u32, u64) {
    #[cfg(target_os = "windows")]
    {
        use windows_sys::Win32::Foundation::SYSTEMTIME;
        use windows_sys::Win32::System::SystemInformation::GetLocalTime;
        let mut time: SYSTEMTIME = unsafe { std::mem::zeroed() };
        unsafe { GetLocalTime(&mut time) };
        let minute_key = (((time.wYear as u64 * 13 + time.wMonth as u64) * 32 + time.wDay as u64)
            * 24
            + time.wHour as u64)
            * 60
            + time.wMinute as u64;
        return (time.wMinute as u32, minute_key);
    }

    #[cfg(not(target_os = "windows"))]
    {
        let minute_key = unix_time_seconds() / 60;
        ((minute_key % 60) as u32, minute_key)
    }
}

fn start_schedule_worker(app: tauri::AppHandle) {
    std::thread::spawn(move || {
        let mut last_checked_minute = None;
        loop {
            let (minute, minute_key) = local_minute_mark();
            let controller = app.state::<VisibilityController>();
            let interval = controller.schedule_interval_minutes.load(Ordering::SeqCst);
            let brief_schedule = controller.brief_schedule.load(Ordering::SeqCst);
            if interval > 0 && Some(minute_key) != last_checked_minute {
                last_checked_minute = Some(minute_key);
                let is_scheduled_minute = match interval {
                    15 | 30 => minute % interval as u32 == 0,
                    45 => minute == 45,
                    60 => minute == 0,
                    _ => false,
                };
                if is_scheduled_minute
                    && unix_time_seconds()
                        >= controller.suppress_schedules_until.load(Ordering::SeqCst)
                {
                    let was_hidden = app
                        .get_webview_window("clock")
                        .and_then(|window| window.is_visible().ok())
                        .map(|visible| !visible)
                        .unwrap_or(false);
                    match show_clock(&app) {
                        Ok(generation) if brief_schedule || was_hidden => {
                            let app_handle = app.clone();
                            let duration = controller
                                .scheduled_show_duration_seconds
                                .load(Ordering::SeqCst);
                            std::thread::spawn(move || {
                                std::thread::sleep(Duration::from_secs(duration));
                                let controller = app_handle.state::<VisibilityController>();
                                if controller.operation_generation.load(Ordering::SeqCst)
                                    == generation
                                    && app_handle
                                        .get_webview_window("clock")
                                        .and_then(|window| window.is_visible().ok())
                                        .unwrap_or(false)
                                {
                                    let _ = request_clock_hide(&app_handle);
                                }
                            });
                        }
                        Ok(_) => {}
                        Err(error) => println!("ERROR Scheduled clock show failed: {error}"),
                    }
                }
            }
            std::thread::sleep(Duration::from_millis(500));
        }
    });
}

fn set_schedule(app: &tauri::AppHandle, interval: u64, mode: Option<ScheduleMode>) {
    match read_settings(app.clone()) {
        Ok(mut settings) => {
            settings.visibility.schedule_interval_minutes = interval;
            if let Some(mode) = mode {
                settings.visibility.schedule_mode = mode;
            }
            if let Err(error) = write_settings(app.clone(), settings) {
                println!("ERROR Failed to save schedule setting: {error}");
            }
        }
        Err(error) => println!("ERROR Failed to read schedule setting: {error}"),
    }
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
    let show_item = tauri::menu::MenuItemBuilder::with_id("clock_show", "Show").build(app)?;
    let hide_15_item =
        tauri::menu::MenuItemBuilder::with_id("hide_15", "For 15 minutes").build(app)?;
    let hide_30_item =
        tauri::menu::MenuItemBuilder::with_id("hide_30", "For 30 minutes").build(app)?;
    let hide_60_item =
        tauri::menu::MenuItemBuilder::with_id("hide_60", "For an hour").build(app)?;
    let hide_submenu = tauri::menu::SubmenuBuilder::new(app, "Hide...")
        .item(&hide_15_item)
        .item(&hide_30_item)
        .item(&hide_60_item)
        .build()?;
    let schedule_off = tauri::menu::MenuItemBuilder::with_id("schedule_off", "Off").build(app)?;
    let schedule_flash_15 =
        tauri::menu::MenuItemBuilder::with_id("schedule_flash_15", "Every 15 minutes")
            .build(app)?;
    let schedule_flash_30 =
        tauri::menu::MenuItemBuilder::with_id("schedule_flash_30", "Every 30 minutes")
            .build(app)?;
    let schedule_flash_45 =
        tauri::menu::MenuItemBuilder::with_id("schedule_flash_45", "At :45 each hour")
            .build(app)?;
    let schedule_flash_60 =
        tauri::menu::MenuItemBuilder::with_id("schedule_flash_60", "Every hour").build(app)?;
    let schedule_brief_15 =
        tauri::menu::MenuItemBuilder::with_id("schedule_brief_15", "Every 15 minutes")
            .build(app)?;
    let schedule_brief_30 =
        tauri::menu::MenuItemBuilder::with_id("schedule_brief_30", "Every 30 minutes")
            .build(app)?;
    let schedule_brief_45 =
        tauri::menu::MenuItemBuilder::with_id("schedule_brief_45", "At :45 each hour")
            .build(app)?;
    let schedule_brief_60 =
        tauri::menu::MenuItemBuilder::with_id("schedule_brief_60", "Every hour").build(app)?;
    let schedule_brief_submenu = tauri::menu::SubmenuBuilder::new(app, "Hide and show briefly")
        .item(&schedule_brief_15)
        .item(&schedule_brief_30)
        .item(&schedule_brief_45)
        .item(&schedule_brief_60)
        .build()?;
    let schedule_flash_submenu = tauri::menu::SubmenuBuilder::new(app, "Keep visible and flash")
        .item(&schedule_flash_15)
        .item(&schedule_flash_30)
        .item(&schedule_flash_45)
        .item(&schedule_flash_60)
        .build()?;
    let schedule_submenu = tauri::menu::SubmenuBuilder::new(app, "Schedule...")
        .item(&schedule_off)
        .item(&schedule_brief_submenu)
        .item(&schedule_flash_submenu)
        .build()?;
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
        .item(&show_item)
        .item(&hide_submenu)
        .item(&schedule_submenu)
        .item(&separator)
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
            "clock_show" => {
                if let Err(error) = show_clock(app) {
                    println!("ERROR Failed to show clock: {error}");
                }
            }
            "hide_15" => hide_clock_for(app, Duration::from_secs(15 * 60)),
            "hide_30" => hide_clock_for(app, Duration::from_secs(30 * 60)),
            "hide_60" => hide_clock_for(app, Duration::from_secs(60 * 60)),
            "schedule_off" => set_schedule(app, 0, None),
            "schedule_flash_15" => set_schedule(app, 15, Some(ScheduleMode::Flash)),
            "schedule_flash_30" => set_schedule(app, 30, Some(ScheduleMode::Flash)),
            "schedule_flash_45" => set_schedule(app, 45, Some(ScheduleMode::Flash)),
            "schedule_flash_60" => set_schedule(app, 60, Some(ScheduleMode::Flash)),
            "schedule_brief_15" => set_schedule(app, 15, Some(ScheduleMode::BriefShow)),
            "schedule_brief_30" => set_schedule(app, 30, Some(ScheduleMode::BriefShow)),
            "schedule_brief_45" => set_schedule(app, 45, Some(ScheduleMode::BriefShow)),
            "schedule_brief_60" => set_schedule(app, 60, Some(ScheduleMode::BriefShow)),
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
async fn wait_for_left_mouse_button_release() {
    #[cfg(target_os = "windows")]
    {
        use std::{thread, time::Duration};
        use windows_sys::Win32::UI::Input::KeyboardAndMouse::{GetAsyncKeyState, VK_LBUTTON};

        let _ = tauri::async_runtime::spawn_blocking(|| {
            while unsafe { GetAsyncKeyState(VK_LBUTTON as i32) < 0 } {
                thread::sleep(Duration::from_millis(16));
            }
        })
        .await;
    }
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

    if let Some(controller) = app.try_state::<VisibilityController>() {
        let was_brief_schedule = controller.brief_schedule.load(Ordering::SeqCst)
            && controller.schedule_interval_minutes.load(Ordering::SeqCst) > 0;
        let is_brief_schedule = settings.visibility.schedule_mode == ScheduleMode::BriefShow
            && settings.visibility.schedule_interval_minutes > 0;
        controller.schedule_interval_minutes.store(
            settings.visibility.schedule_interval_minutes,
            Ordering::SeqCst,
        );
        controller.scheduled_show_duration_seconds.store(
            settings.visibility.scheduled_show_duration_seconds,
            Ordering::SeqCst,
        );
        controller
            .brief_schedule
            .store(is_brief_schedule, Ordering::SeqCst);
        if was_brief_schedule != is_brief_schedule {
            let visibility_result = if is_brief_schedule {
                request_clock_hide(&app).map(|_| ())
            } else {
                show_clock(&app).map(|_| ())
            };
            if let Err(error) = visibility_result {
                println!("WARN Failed to apply schedule visibility: {error}");
            }
        }
    }

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
    if settings.visibility.fade_in_duration_ms > 2000 {
        settings.visibility.fade_in_duration_ms = defaults.visibility.fade_in_duration_ms;
    }
    if settings.visibility.fade_out_duration_ms > 2000 {
        settings.visibility.fade_out_duration_ms = defaults.visibility.fade_out_duration_ms;
    }
    if !(5..=300).contains(&settings.visibility.scheduled_show_duration_seconds) {
        settings.visibility.scheduled_show_duration_seconds =
            defaults.visibility.scheduled_show_duration_seconds;
    }
    if ![0, 15, 30, 45, 60].contains(&settings.visibility.schedule_interval_minutes) {
        settings.visibility.schedule_interval_minutes =
            defaults.visibility.schedule_interval_minutes;
    }
    if !matches!(
        settings.visibility.schedule_mode,
        ScheduleMode::Flash | ScheduleMode::BriefShow
    ) {
        settings.visibility.schedule_mode = defaults.visibility.schedule_mode;
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
            hide_clock_window,
            wait_for_left_mouse_button_release,
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
            app.manage(VisibilityController::new(&settings));

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
            start_schedule_worker(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn hide_clock_window(window: tauri::WebviewWindow) -> Result<(), String> {
    window.hide().map_err(|error| error.to_string())
}
