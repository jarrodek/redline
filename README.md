# Redline — Lightweight Image Annotation Tool

Redline is a high-performance, lightweight desktop image editor designed specifically for creating documentation screenshots, UI mockups, and quick image markups. 

Unlike heavy Electron-based applications, Redline compiles down to a native package of **under 5 MB** (typically ~4.4 MB on Ubuntu) and runs with a minimal memory footprint. It utilizes **Tauri v2** to load a fast, secure WebKit webview, with application logic written in HTML5, CSS3, and Vanilla TypeScript.

---

## 🚀 Key Features

*   **Zero Bloat:** Packaged executable is ~4.4 MB. Loads instantly and uses a fraction of the RAM of typical screenshot tools.
*   **Vector Annotation Layer:** All drawn shapes are kept as vectors. You can select, move, resize, recolor, adjust stroke width, or delete any shape after placing it.
*   **Screenshot Clipboard Paste (`Ctrl+V`):** Paste screenshots directly from your system clipboard to edit them immediately.
*   **Drag & Drop:** Drop any image file directly onto the canvas to open it.
*   **Annotation Tools:**
    *   **Select Tool:** Grab, move, and drag corners to scale shapes or text.
    *   **Rectangle / Rounded Rectangle:** Draw bounding boxes with border thickness sliders and fill options.
    *   **Circle:** Focus circles for UI components.
    *   **Highlight Marker:** Semi-transparent highlighter using the canvas `multiply` blend mode to keep text and UI elements underneath perfectly visible and dark (rather than washed out).
    *   **Text Tool:** Click to create a text block with adjustable size and bold formatting.
*   **Canvas Transforms:**
    *   **Crop Mode:** Resizable crop frame; existing annotations automatically adjust relative to the cropped top-left corner.
    *   **Resize Canvas:** Adjust image pixel dimensions with optional aspect-ratio lock.
*   **Navigation & Zoom:**
    *   **Spacebar + Mouse Drag:** Pan around the viewport when zoomed in.
    *   **Auto-Fit:** Auto-scales large images proportionally to fit the viewport, while keeping them at 100% resolution.
    *   **Zoom Controls:** Scale canvas viewport from 10% to 500%.
*   **History Stack:** Full, infinite vector-based **Undo (Ctrl+Z)** and **Redo (Ctrl+Y)**.
*   **Native File Integration:** Opens and saves files (`.png`) natively using system open/save file pickers.

---

## 🛠️ System Prerequisites (Ubuntu/Debian)

To compile or run the application in development, you need the GTK, WebKitGTK development headers, and the Rust compiler.

### 1. Install GTK & WebKit Dev Packages
Run the following command to install the required system compilation dependencies:
```bash
sudo apt-get update && sudo apt-get install -y \
  build-essential \
  curl \
  wget \
  file \
  libglib2.0-dev \
  libsoup-3.0-dev \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev
```

### 2. Install Rust Toolchain
Install the Rust compiler using `rustup`:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
*Choose Option `1` (standard installation).*

### 3. FUSE Compatibility (for AppImage packaging)
To package the app as an `AppImage` using the built-in bundler (`linuxdeploy`), you will also need the FUSE 2 library:
```bash
sudo apt-get install -y libfuse2t64
```

---

## 💻 Developer Guide

### 1. Project Initialization
Clone or navigate to the directory and install NPM packages:
```bash
cd redline
npm install
```

### 2. Source Rust Paths
Make sure Cargo is in your terminal environment:
```bash
source "$HOME/.cargo/env"
```

### 3. Run in Development Mode
Launches the application locally with Hot Module Replacement (HMR) for instant UI updates:
```bash
npm run tauri dev
```

---

## 📦 Production Builds & Packaging

To compile the application in release mode and generate standalone installer packages:

```bash
source "$HOME/.cargo/env"
npm run tauri build
```

Once completed, Tauri will output the native builds to the bundle directory:
*   **Debian Package (`.deb`):** `src-tauri/target/release/bundle/deb/redline_0.1.0_amd64.deb`
*   **AppImage (`.AppImage`):** `src-tauri/target/release/bundle/appimage/redline_0.1.0_amd64.AppImage`

### Installing the Debian Package:
```bash
sudo dpkg -i src-tauri/target/release/bundle/deb/redline_0.1.0_amd64.deb
sudo apt-get install -f # Fixes any missing dependencies
```
