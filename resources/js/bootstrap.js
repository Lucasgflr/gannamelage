import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// Remove Content-Type header for FormData requests so browser sets correct multipart boundary
axios.interceptors.request.use(config => {
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
});

window.axios = axios;

export default axios;
