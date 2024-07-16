import { defineConfig } from "vite";
import { htmlHmrPlugin } from "./src/html-hmr.vite.plugin";
import { fileURLToPath } from "url";
import * as islands from "./src/islands";
import { resolve } from "path";

export default defineConfig({
  plugins: [htmlHmrPlugin(islands)],
  // prevent vite from obscuring rust errors
  clearScreen: false,
  base: process.env.BASE_URL || "/",
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    hmr: true,
    port: 3000,
    strictPort: true
  },
  // to access the Tauri environment variables set by the CLI with information about the current target
  envPrefix: [
    "VITE_",
    "TAURI_PLATFORM",
    "TAURI_ARCH",
    "TAURI_FAMILY",
    "TAURI_PLATFORM_VERSION",
    "TAURI_PLATFORM_TYPE",
    "TAURI_DEBUG"
  ],
  build: {
    // Tauri uses Chromium on Windows and WebKit on macOS and Linux
    target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    // don't minify for debug builds
    minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // produce sourcemaps for debug builds
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        ui_tests: resolve(__dirname, "tests/index.html")
      }
    }
  },
  resolve: {
    // TODO add @ alias?
    alias: [
      {
        find: "xui",
        replacement: fileURLToPath(new URL("./src/XUI.ts", import.meta.url))
      },
      {
        find: "htmx.org",
        replacement: fileURLToPath(
          new URL("./src/htmx.esm.js", import.meta.url)
        )
      }
    ]
  }
});
