
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import App from './App.vue';


// Material Icons 
import { loadMaterialSymbols } from './modules/iconLoader';
// Pass an array icon names to be loaded via Google Fonts CDN
loadMaterialSymbols([
    'home', 'palette', 'settings', 'info', 'rotate_90_degrees_cw',
    'step_over', 'close_fullscreen', 'open_in_full', 'warning',
    'video_file', 'frame_source', 'barcode', 'timer', 'speed',
    'calculate', 'view_compact', 'rotate_right', 'equalizer',
    'arrow_range', 'double_arrow', 'filter_alt'
])
// Note: we could also import the entire set, but the bundle is too big.
// import 'material-symbols/outlined.css';


const app = createApp(App);

const pinia = createPinia();
app.use(pinia);


app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
})


import Tooltip from 'primevue/tooltip';
app.directive('tooltip', Tooltip);

// Initialize BASIS Universal WASM for KTX2 encoding
// This preloads the encoder so it's ready when needed
import { loadBasisModule } from './modules/load_basis.js';
import { useAppStore } from './stores/appStore.js';
import { chooseRenderer } from './utils/renderer-utils.js';


// Initialize app
(async () => {
    try {
        // Choose renderer first
        const rendererType = await chooseRenderer();

        // Load BASIS module
        await loadBasisModule();
        console.log('[Main] BASIS module preloaded successfully');

        // Mount app
        app.mount('#app');

        // Set renderer type in store after app is mounted (so store is available)
        const store = useAppStore();
        store.rendererType = rendererType;
        console.log('[Main] Renderer type set in store:', rendererType);

    } catch (error) {
        console.error('[Main] Initialization error:', error);
        // Mount anyway - app can still work with WebM
        app.mount('#app');
    }
})();
