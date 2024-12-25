
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
    'arrow_range', 'double_arrow'
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

app.mount('#app');
