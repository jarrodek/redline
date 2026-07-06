// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use tauri::menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder};
use tauri::Emitter;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .setup(|app| {
            // File Submenu
            let open_item = MenuItemBuilder::new("Open File...").id("open").accelerator("CmdOrCtrl+O").build(app)?;
            let export_item = MenuItemBuilder::new("Export Image...").id("export").accelerator("CmdOrCtrl+S").enabled(false).build(app)?;
            let copy_item = MenuItemBuilder::new("Copy to Clipboard").id("copy").accelerator("CmdOrCtrl+Shift+C").enabled(false).build(app)?;
            let file_submenu = SubmenuBuilder::with_id(app, "file_menu", "File")
                .item(&open_item)
                .item(&export_item)
                .item(&copy_item)
                .build()?;

            // Edit Submenu
            let undo_item = MenuItemBuilder::new("Undo").id("undo").accelerator("CmdOrCtrl+Z").enabled(false).build(app)?;
            let redo_item = MenuItemBuilder::new("Redo").id("redo").accelerator("CmdOrCtrl+Shift+Z").enabled(false).build(app)?;
            let clear_edits_item = MenuItemBuilder::new("Clear All Edits").id("clear_edits").enabled(false).build(app)?;
            let clear_canvas_item = MenuItemBuilder::new("Clear Canvas").id("clear_canvas").enabled(false).build(app)?;
            let edit_submenu = SubmenuBuilder::with_id(app, "edit_menu", "Edit")
                .item(&undo_item)
                .item(&redo_item)
                .separator()
                .item(&clear_edits_item)
                .item(&clear_canvas_item)
                .build()?;

            // App Main Menu
            let menu = MenuBuilder::new(app)
                .item(&file_submenu)
                .item(&edit_submenu)
                .build()?;

            app.set_menu(menu)?;

            // Menu Event Listener
            app.on_menu_event(move |app_handle, event| {
                let id = event.id().0.as_str();
                let _ = app_handle.emit("menu-action", id);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet, set_menu_enabled])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn set_menu_enabled(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    if let Some(menu) = app.menu() {
        if let Some(file_item) = menu.get("file_menu") {
            if let Some(file_submenu) = file_item.as_submenu() {
                let file_items = ["export", "copy"];
                for id in file_items {
                    if let Some(item) = file_submenu.get(id) {
                        if let Some(menu_item) = item.as_menuitem() {
                            let _ = menu_item.set_enabled(enabled);
                        }
                    }
                }
            }
        }
        if let Some(edit_item) = menu.get("edit_menu") {
            if let Some(edit_submenu) = edit_item.as_submenu() {
                let edit_items = ["undo", "redo", "clear_edits", "clear_canvas"];
                for id in edit_items {
                    if let Some(item) = edit_submenu.get(id) {
                        if let Some(menu_item) = item.as_menuitem() {
                            let _ = menu_item.set_enabled(enabled);
                        }
                    }
                }
            }
        }
    }
    Ok(())
}
