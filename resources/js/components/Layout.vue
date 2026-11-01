<!--
  Moldura visual de todas as telas.

  A barra do topo (logo, botão Novo Imóvel e Sair) só aparece quando
  as três condições são verdadeiras:
    - o auth store já terminou de conferir o token (ready);
    - existe token, ou seja, a pessoa está logada;
    - a rota não é de visitante (a tela de login marca meta.guest).

  A landing pública (/p/slug) não marca guest nem requiresAuth, então
  a barra também fica oculta nela, porque isAuthenticated é falso
  para quem abre o link sem ter feito login.

  Sair apaga o token e recarrega /login. O recarregamento completo
  (window.location) limpa o estado em memória do Vue.
-->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Barra superior, exclusiva da área logada. -->
    <nav
      v-if="authStore.ready && authStore.isAuthenticated && !isGuestRoute"
      class="bg-white shadow-sm border-b"
    >
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <router-link :to="{ name: 'dashboard' }" class="text-xl font-bold text-blue-600">
              Gannam&Lage - Vendas
            </router-link>
            <span class="ml-2 text-sm text-gray-500">Vendas</span>
          </div>
          <div class="flex items-center gap-4">
            <router-link
              :to="{ name: 'properties.create' }"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
            >
              + Novo Imóvel
            </router-link>
            <button
              @click="logout"
              class="text-gray-600 hover:text-red-600 text-sm font-medium transition"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
    <!-- Conteúdo da rota. As páginas filhas são desenhadas aqui. -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { useRouter, useRoute } from 'vue-router';
import { computed } from 'vue';

const authStore = useAuthStore();
// router fica disponível, mas Sair não usa push: recarrega /login por completo.
const router = useRouter();
const route = useRoute();

// Verdadeiro na tela de login, para esconder a barra mesmo se sobrar um token.
const isGuestRoute = computed(() => !!route.meta?.guest);

// Apaga o token no servidor e no navegador, depois abre a tela de login do zero.
async function logout() {
  await authStore.logout();
  window.location.href = '/login';
}
</script>
