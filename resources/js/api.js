import axios from 'axios';

axios.defaults.withCredentials = true;
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';

// Interceptor para garantir multipart boundary correto em uploads
axios.interceptors.request.use(config => {
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
        delete config.headers['content-type'];
    }
    return config;
});

export default axios;
