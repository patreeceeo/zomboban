import { defineConfig } from "vite";
import { fileURLToPath } from "url";
import { resolve } from "path";
import marko from "@marko/vite";
import path from "path";

// Custom plugin to enable Marko HMR with dependency tracking
const markoHmrPlugin = () => {
  const dependencyMap = new Map<string, Set<string>>(); // Maps file paths to their dependencies
  const reverseDependencyMap = new Map<string, Set<string>>(); // Maps dependencies to files that import them

  const updateDependencyMaps = (filePath: string, dependencies: string[]) => {
    // Clear old dependencies for this file
    const oldDeps = dependencyMap.get(filePath) || new Set();
    for (const oldDep of oldDeps) {
      const reverseDeps = reverseDependencyMap.get(oldDep);
      if (reverseDeps) {
        reverseDeps.delete(filePath);
        if (reverseDeps.size === 0) {
          reverseDependencyMap.delete(oldDep);
        }
      }
    }

    // Set new dependencies
    const newDeps = new Set(dependencies);
    dependencyMap.set(filePath, newDeps);

    // Update reverse dependency map
    for (const dep of newDeps) {
      if (!reverseDependencyMap.has(dep)) {
        reverseDependencyMap.set(dep, new Set());
      }
      reverseDependencyMap.get(dep)!.add(filePath);
    }
  };

  const extractMarkoImports = (content: string) => {
    const imports: string[] = [];
    // Match Marko import statements (they don't use 'from' keyword)
    // Examples: import EntityInspector from "./EntityInspector.marko"
    const importRegex = /import\s+\w+\s+from\s+["']([^"']+\.marko)["']/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  };

  return {
    name: 'marko-hmr',
    buildStart() {
      // Clear maps on build start
      dependencyMap.clear();
      reverseDependencyMap.clear();
    },
    load(id: string) {
      if (id.endsWith('.marko')) {
        // We'll process dependencies in the transform hook
        return null;
      }
    },
    transform(code: string, id: string) {
      if (id.endsWith('.marko')) {
        // Extract and track dependencies
        const dependencies = extractMarkoImports(code);
        console.log(`[Marko HMR] Raw dependencies found in ${id}:`, dependencies);

        if (dependencies.length > 0) {
          // Resolve relative paths to absolute paths
          const resolvedDependencies = dependencies.map(dep => {
            if (dep.startsWith('./') || dep.startsWith('../')) {
              // Convert relative path to absolute
              const dir = path.dirname(id);
              return path.resolve(dir, dep);
            }
            return dep;
          });

          console.log(`[Marko HMR] Resolved dependencies for ${id}:`, resolvedDependencies);
          updateDependencyMaps(id, resolvedDependencies);
        }
      }
      return null;
    },
    handleHotUpdate(ctx: any) {
      if (ctx.file.endsWith('.marko')) {
        console.log('[Vite Plugin] Marko file changed:', ctx.file);

        // Find all files that depend on this changed file (directly or indirectly)
        const affectedFiles = new Set<string>();
        const queue = [ctx.file];

        while (queue.length > 0) {
          const currentFile = queue.shift()!;
          affectedFiles.add(currentFile);

          // Find files that import this file
          const dependents = reverseDependencyMap.get(currentFile) || new Set();
          for (const dependent of dependents) {
            if (!affectedFiles.has(dependent)) {
              queue.push(dependent);
            }
          }
        }

        console.log('[Vite Plugin] Affected files:', Array.from(affectedFiles));

        // Invalidate all affected modules in Vite's module graph
        for (const affectedFile of affectedFiles) {
          const module = ctx.server.moduleGraph.getModuleById(affectedFile);
          if (module) {
            console.log('[Vite Plugin] Invalidating module:', affectedFile);
            ctx.server.moduleGraph.invalidateModule(module);
            // Also invalidate all modules that import this one
            for (const importer of module.importers) {
              ctx.server.moduleGraph.invalidateModule(importer);
            }
          }
        }

        // Send custom HMR event to client with all affected files
        ctx.server.ws.send({
          type: 'custom',
          event: 'marko-template-updated',
          data: {
            file: ctx.file,
            affectedFiles: Array.from(affectedFiles),
            timestamp: Date.now()
          }
        });

        // Return empty array to prevent full page reload and use our custom handling
        return [];
      }
    }
  };
};

export default defineConfig({
  plugins: [marko({linked: false}), markoHmrPlugin()],
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
        main: resolve(__dirname, "index.html")
      }
    }
  },
  resolve: {
    // TODO add @ alias?
    alias: [
      {
        find: "htmx.org",
        replacement: fileURLToPath(
          new URL("./src/htmx.esm.js", import.meta.url)
        )
      }
    ]
  }
});
