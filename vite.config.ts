import { defineConfig } from "vite";
import { resolve } from "path";
import svgr from "vite-plugin-svgr";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from 'vite-plugin-node-polyfills';


// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                exportType: "default",
                ref: true,
                svgo: false,
                titleProp: true,
                icon: true,
            },
            include: "**/*.svg",
        }),
        nodePolyfills({ protocolImports: true }),
    ],

    resolve: {
        alias: {
            "@suite": resolve(__dirname, "./src"),
            "@animations": resolve(__dirname, "./src/animations"),
            "@assets": resolve(__dirname, "./src/assets"),
            "@commands": resolve(__dirname, "./src/commands"),
            "@components": resolve(__dirname, "./src/components"),
            "@home": resolve(__dirname, "./src/home"),
            "@hooks": resolve(__dirname, "./src/hooks"),
            "@icons": resolve(__dirname, "./src/icons"),
            "@intro": resolve(__dirname, "./src/intro"),
            "@jupyter": resolve(__dirname, "./src/jupyter"),
            "@kineticlaw": resolve(__dirname, "./src/kineticlaw"),
            "@llm": resolve(__dirname, "./src/llm"),
            "@measurements": resolve(__dirname, "./src/measurements"),
            "@modelling": resolve(__dirname, "./src/modelling"),
            "@parameters": resolve(__dirname, "./src/parameters"),
            "@proteins": resolve(__dirname, "./src/proteins"),
            "@reactions": resolve(__dirname, "./src/reactions"),
            "@smallmols": resolve(__dirname, "./src/smallmols"),
            "@stores": resolve(__dirname, "./src/stores"),
            "@tauri": resolve(__dirname, "./src/tauri"),
            "@suite-types": resolve(__dirname, "./src/types"),
            "@utilities": resolve(__dirname, "./src/utilities"),
            "@vessels": resolve(__dirname, "./src/vessels"),
            "@visualisation": resolve(__dirname, "./src/visualisation"),
            // shims for node polyfills
            fs: resolve(__dirname, "./src/shims/fs.ts"),
            path: resolve(__dirname, "./src/shims/path.ts"),
            stream: resolve(__dirname, "./src/shims/stream.ts"),
        },
    },

    define: {
        global: 'globalThis',
    },

    optimizeDeps: {
        include: ['buffer', 'process', 'util', 'path-browserify'],
    },

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },

    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, "index.html"),
                visualisation: resolve(__dirname, "viswindow/index.html"),
            },
        },
    },
}));