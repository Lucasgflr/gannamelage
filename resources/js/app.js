import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './components/App.vue';
import VueSweetalert2 from 'vue-sweetalert2';
import Vue3Toasity from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './bootstrap';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(VueSweetalert2);
app.use(Vue3Toasity, {
  autoClose: 3000,
  position: 'top-right',
  theme: 'colored',
});
app.mount('#app');
