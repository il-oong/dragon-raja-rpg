// Dragon Raja RPG — Tauri 메인 프로세스
// Electron의 main.js를 대체한다.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager, Emitter};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, ShortcutState};

// ─── 세이브 파일 경로 ─────────────────────────────
fn saves_path(app: &AppHandle) -> PathBuf {
    let dir = app
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| std::env::temp_dir());
    if !dir.exists() {
        let _ = fs::create_dir_all(&dir);
    }
    dir.join("saves.json")
}

fn read_saves(app: &AppHandle) -> Vec<serde_json::Value> {
    let path = saves_path(app);
    if !path.exists() {
        return vec![];
    }
    match fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_default(),
        Err(_) => vec![],
    }
}

fn write_saves(app: &AppHandle, saves: &[serde_json::Value]) -> Result<(), String> {
    let path = saves_path(app);
    let json = serde_json::to_string_pretty(saves).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

// ─── Tauri Commands (Electron IPC 대체) ───────────
#[tauri::command]
fn list_saves(app: AppHandle) -> Vec<serde_json::Value> {
    read_saves(&app)
}

#[tauri::command]
fn save_char(app: AppHandle, id: String, data: serde_json::Value) -> Result<(), String> {
    let mut saves = read_saves(&app);
    let mut data = data;
    if let Some(obj) = data.as_object_mut() {
        obj.insert("id".to_string(), serde_json::Value::String(id.clone()));
        let now_ms = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        obj.insert(
            "lastPlayed".to_string(),
            serde_json::Value::Number(serde_json::Number::from(now_ms)),
        );
    }
    let mut found = false;
    for s in saves.iter_mut() {
        if s.get("id").and_then(|v| v.as_str()) == Some(&id) {
            *s = data.clone();
            found = true;
            break;
        }
    }
    if !found {
        saves.push(data);
    }
    write_saves(&app, &saves)
}

#[tauri::command]
fn delete_char(app: AppHandle, id: String) -> Result<(), String> {
    let mut saves = read_saves(&app);
    saves.retain(|s| s.get("id").and_then(|v| v.as_str()) != Some(&id));
    write_saves(&app, &saves)
}

#[derive(serde::Deserialize)]
struct ImportArgs {
    text: String,
    mode: String,
}
#[derive(serde::Serialize)]
struct ImportResult {
    ok: bool,
    count: usize,
    error: Option<String>,
}

#[tauri::command]
fn import_saves(app: AppHandle, args: ImportArgs) -> ImportResult {
    let parsed: Vec<serde_json::Value> = match serde_json::from_str(&args.text) {
        Ok(v) => v,
        Err(e) => {
            return ImportResult {
                ok: false,
                count: 0,
                error: Some(format!("JSON 파싱 실패: {}", e)),
            }
        }
    };
    for s in &parsed {
        if !s.is_object() || s.get("name").is_none() || s.get("id").is_none() {
            return ImportResult {
                ok: false,
                count: 0,
                error: Some("올바른 캐릭터 데이터가 아닙니다".to_string()),
            };
        }
    }
    let merged: Vec<serde_json::Value> = if args.mode == "merge" {
        let existing = read_saves(&app);
        let mut map: std::collections::BTreeMap<String, serde_json::Value> =
            std::collections::BTreeMap::new();
        for s in existing {
            if let Some(id) = s.get("id").and_then(|v| v.as_str()) {
                map.insert(id.to_string(), s);
            }
        }
        for s in parsed {
            if let Some(id) = s.get("id").and_then(|v| v.as_str()) {
                map.insert(id.to_string(), s);
            }
        }
        map.into_values().collect()
    } else {
        parsed
    };
    if let Err(e) = write_saves(&app, &merged) {
        return ImportResult {
            ok: false,
            count: 0,
            error: Some(e),
        };
    }
    ImportResult {
        ok: true,
        count: merged.len(),
        error: None,
    }
}

// ─── 메인 ────────────────────────────────────────
fn main() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, shortcut, event| {
                    if event.state() != ShortcutState::Pressed {
                        return;
                    }
                    let key = shortcut.key;
                    let mods = shortcut.mods;
                    let ctrl_shift = Modifiers::CONTROL | Modifiers::SHIFT;
                    if mods == ctrl_shift {
                        match key {
                            Code::KeyB => {
                                if let Some(win) = app.get_webview_window("main") {
                                    if win.is_visible().unwrap_or(false) {
                                        let _ = win.hide();
                                    } else {
                                        let _ = win.show();
                                        let _ = win.set_focus();
                                    }
                                }
                            }
                            Code::KeyQ => {
                                app.exit(0);
                            }
                            Code::KeyD => {
                                let _ = app.emit("toggle-disguise", ());
                            }
                            _ => {}
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            use tauri_plugin_global_shortcut::GlobalShortcutExt;
            let ctrl_shift = Modifiers::CONTROL | Modifiers::SHIFT;
            let shortcuts = [
                Shortcut::new(Some(ctrl_shift), Code::KeyB),
                Shortcut::new(Some(ctrl_shift), Code::KeyQ),
                Shortcut::new(Some(ctrl_shift), Code::KeyD),
            ];
            app.global_shortcut().register_multiple(shortcuts)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_saves,
            save_char,
            delete_char,
            import_saves
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
