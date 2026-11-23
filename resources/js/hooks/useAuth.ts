import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export function useAuth() {
    const queryClient = useQueryClient();
    const [authenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));

    useEffect(() => {
        const expired = () => {
            queryClient.clear();
            setAuthenticated(false);
        };
        window.addEventListener('auth-expired', expired);
        const controller = new AbortController();
        if (localStorage.getItem('token')) {
            void api.get('/api/user', { signal: controller.signal }).catch(() => {});
        }
        return () => {
            window.removeEventListener('auth-expired', expired);
            controller.abort();
        };
    }, [queryClient]);

    async function login(email: string, password: string) {
        await api.get('/sanctum/csrf-cookie');
        const { data } = await api.post<{ token: string }>('/api/login', { email, password });
        localStorage.setItem('token', data.token);
        setAuthenticated(true);
    }

    async function logout() {
        try {
            await api.post('/api/logout', {}, { timeout: 5000 });
        } finally {
            localStorage.removeItem('token');
            queryClient.clear();
            setAuthenticated(false);
        }
    }

    return { authenticated, login, logout };
}
