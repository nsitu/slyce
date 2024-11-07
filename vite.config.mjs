// vite.config.mjs
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import vueDevTools from 'vite-plugin-vue-devtools'
import vue from '@vitejs/plugin-vue';


export default defineConfig({
    plugins: [
        vue(),
        vueDevTools(),
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/web-demuxer/dist/wasm-files/*',
                    dest: 'public'
                }
            ]
        })
    ]
});
