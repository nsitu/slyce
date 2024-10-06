
import { createPinia } from 'pinia';
import { createApp } from 'vue';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);



import App from './App.vue';



app.mount('#app');


