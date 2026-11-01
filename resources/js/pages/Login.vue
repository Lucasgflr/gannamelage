<!--
  Tela de entrada do sistema (rota /login).

  Pede e-mail e senha e entrega os dois ao auth store, que chama
  POST /api/login. Se o servidor aceitar, o token fica no navegador
  e o router manda para o painel. Se recusar, a mensagem de erro
  aparece embaixo do botão. Enquanto a requisição não volta, o botão
  fica desabilitado e o texto muda para "Entrando...".
-->
<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
    <div class="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-extrabold text-blue-700">Gannam&Lage - Vendas</h1>
        <p class="text-gray-500 mt-2 text-sm">Gerenciamento de Imóveis</p>
      </div>
      <form @submit.prevent="handleLogin">
        <div class="mb-5">
          <label class="block text-sm font-semibold text-gray-700 mb-1">Email</label>
          <input
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="seu@email.com"
            required
          />
        </div>
        <div class="mb-6">
          <label class="block text-sm font-semibold text-gray-700 mb-1">Senha</label>
          <input
            v-model="form.password"
            type="password"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            placeholder="********"
            required
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md"
          :disabled="loading"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
        <p v-if="error" class="text-red-500 text-sm text-center mt-4">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();
// loading trava o botão durante o pedido. error guarda o texto vermelho.
const loading = ref(false);
const error = ref('');

// Os dois campos do formulário. v-model no template escreve aqui.
const form = reactive({ email: '', password: '' });

// Impede o envio tradicional do formulário (a página não recarrega)
// e faz o login pela API. Credencial errada cai no catch.
async function handleLogin() {
  loading.value = true;
  error.value = '';
  try {
    await authStore.login(form);
    router.push({ name: 'dashboard' });
  } catch (e) {
    error.value = e.response?.data?.message || 'Erro ao autenticar.';
  } finally {
    loading.value = false;
  }
}
</script>
