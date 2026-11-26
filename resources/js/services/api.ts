import axios from 'axios';

export const api = axios.create({
    withCredentials: true,
    withXSRFToken: true,
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
});

api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token && !config.url?.startsWith('/api/public/')) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(response => response, error => {
    const token = localStorage.getItem('token');
    if (token && error.response?.status === 401 && error.config?.headers.Authorization === `Bearer ${token}`) {
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-expired'));
    }
    return Promise.reject(error);
});

export function errorMessage(error: unknown, fallback: string) {
    if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
        const { errors, message } = error.response?.data ?? {};
        if (errors) return Object.values(errors).flat().join(' ');
        if (message) return message;
    }
    return fallback;
}
