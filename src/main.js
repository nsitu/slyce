
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import App from './App.vue';


import 'material-symbols';

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


