import { defineConfig } from "vite";
import { htmlHmrPlugin } from "./src/html-hmr.vite.plugin";
import { fileURLToPath } from "url";
import { resolve } from "path";
import { namedTemplates } from "./src/templates";
import marko from "@marko/vite";

// Custom plugin to enable Marko HMR
const markoHmrPlugin = () => ({
  name: 'marko-hmr',
  handleHotUpdate(ctx: any) {
    if (ctx.file.endsWith('.marko')) {
      console.log('[Vite Plugin] Marko file changed:', ctx.file);

      // Send custom HMR event to client
      ctx.server.ws.send({
        type: 'custom',
        event: 'marko-template-updated',
        data: {
          file: ctx.file,
          timestamp: Date.now()
        }
      });

      // Return empty array to prevent full page reload
      return [];
    }
  }
});

export default defineConfig({
  plugins: [marko({linked: false}), markoHmrPlugin(), htmlHmrPlugin(new Set(Object.values(namedTemplates)))],
  // prevent vite from obscuring rust errors
  clearScreen: false,
  base: process.env.BASE_URL || "/",
  // Tauri expects a fixed port, fail if that port is not available
  server: {
    hmr: true,
    port: 3000,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001"
      }
    }
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
    target: "es6",
    // target: process.env.TAURI_PLATFORM == "windows" ? "chrome105" : "safari13",
    // don't minify for debug builds
    minify: "esbuild",
    // minify: !process.env.TAURI_DEBUG ? "esbuild" : false,
    // produce sourcemaps for debug builds
    // sourcemap: !!process.env.TAURI_DEBUG,
    sourcemap: process.env.ENV !== "production",
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
        find: "Zui",
        replacement: fileURLToPath(new URL("./src/Zui", import.meta.url))
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
