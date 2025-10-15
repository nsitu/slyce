// vite.config.mjs
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools'
import vue from '@vitejs/plugin-vue';

import tailwindcss from '@tailwindcss/vite'

// The repo name is always the bit after the “/” 
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? '';

export default defineConfig({
    // Locally you still get “/”, but on Actions you get “/repositoryName/”
    base: process.env.GITHUB_ACTIONS === 'true' ? `/${repositoryName}/` : '/',
    plugins: [

        tailwindcss(),
        vue(),
        vueDevTools(),
        // NOTE: WASM files are manually copied to public/wasm-files/
        // If updating web-demuxer version, manually copy the new wasm files:
        // Copy-Item -Path "node_modules/web-demuxer/dist/wasm-files/*" -Destination "public/wasm-files/" -Force
    ]
});

