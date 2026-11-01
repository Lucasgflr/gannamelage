import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from '../api';

export const useAuthStore = defineStore('auth', () => {
    const user = ref(null);
    const token = ref(localStorage.getItem('token') || null);
    const ready = ref(false);

    // Se existe token no localStorage, consideramos autenticado
    // O user sera carregado assincronamente
    const isAuthenticated = computed(() => !!token.value);

    // Se houver token, configura o header do axios imediatamente
    // para que outras requisicoes funcionem antes do fetchUser completar
    if (token.value) {
        axios.defaults.headers.common.Authorization = `Bearer ${token.value}`;
    }

    async function fetchUser() {
        if (!token.value) {
            ready.value = true;
            return;
        }
        try {
            const { data } = await axios.get('/api/user', {
                headers: { Authorization: `Bearer ${token.value}` },
            });
            user.value = data;
        } catch (e) {
            // So limpa o token se for erro 401 (nao autorizado)
            // Erros de rede (500, timeout, etc) nao devem desconectar o usuario
            if (e.response && e.response.status === 401) {
                user.value = null;
                token.value = null;
                localStorage.removeItem('token');
                delete axios.defaults.headers.common.Authorization;
            }
            // Outros erros: apenas ignora, mantem o token
        } finally {
            ready.value = true;
        }
    }

    async function login(credentials) {
        await axios.get('/sanctum/csrf-cookie');
        const { data } = await axios.post('/api/login', credentials);
        token.value = data.token;
        localStorage.setItem('token', data.token);
        axios.defaults.headers.common.Authorization = `Bearer ${data.token}`;
        await fetchUser();
    }

    async function logout() {
        const currentToken = token.value;
        user.value = null;
        token.value = null;
        localStorage.removeItem('token');
        delete axios.defaults.headers.common.Authorization;
        if (currentToken) {
            try {
                await axios.post('/api/logout', {}, {
                    headers: { Authorization: `Bearer ${currentToken}` },
                });
            } catch (e) {
                // ignore
            }
        }
    }

    fetchUser();

    return { user, token, ready, isAuthenticated, fetchUser, login, logout };
});
