// vite.config.mjs
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
    plugins: [
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
