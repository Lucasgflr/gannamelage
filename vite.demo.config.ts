import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export default defineConfig({
    root: path('./demo'),
    base: '/gannamelage/',
    publicDir: false,
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: [
            { find: '../services/api', replacement: path('./demo/api.ts') },
            { find: '../services/share', replacement: path('./demo/share.ts') },
        ],
    },
    // Keep the application's modules available to the demo dev server.
    server: { fs: { allow: [path('./')] } },
    build: { outDir: path('./dist-demo'), emptyOutDir: true },
});
