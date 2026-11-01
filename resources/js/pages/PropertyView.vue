<!--
  Ficha interna do imóvel (rota /properties/:id/view). Exige login.

  Mostra o imóvel como a equipe vê antes de mandar o link ao cliente:
  foto grande, preço, cômodos, descrição, galeria e dados do proprietário.
  Os dados vêm de GET /api/properties/{id}, que inclui o dono.

  Clicar na foto abre um lightbox (a foto em tela cheia). As setas do
  teclado trocam a imagem e Esc fecha. O botão WhatsApp manda o link
  público /p/{slug}, não o endereço interno desta ficha.
-->
<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Carregando...</p>
  </div>
  <div v-else-if="!property" class="min-h-screen flex items-center justify-center">
    <p class="text-gray-500">Imóvel não encontrado.</p>
  </div>
  <div v-else class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="bg-white border-b px-6 py-4">
      <div class="max-w-5xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-2">
          <router-link :to="{ name: 'dashboard' }" class="text-gray-500 hover:text-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </router-link>
          <span class="font-bold text-xl text-blue-700">Gannam&Lage - Vendas</span>
        </div>
        <div class="flex items-center gap-3">
          <a :href="`/p/${property.slug}`" target="_blank" class="text-sm text-blue-600 hover:underline">Ver Landing Page</a>
          <button @click="shareWhatsApp" class="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition">WhatsApp</button>
        </div>
      </div>
    </nav>

    <main class="max-w-5xl mx-auto px-6 py-8">
      <!-- Main Photo -->
      <div class="rounded-2xl overflow-hidden mb-8 h-96 bg-gray-200 cursor-pointer" @click="openLightbox(0)">
        <img v-if="mainPhoto" :src="`/storage/${mainPhoto.path}`" class="w-full h-full object-cover" alt="Foto principal" />
      </div>

      <!-- Title and Price -->
      <h1 class="text-3xl font-bold text-gray-900 mb-2">{{ property.title }}</h1>
      <p class="text-gray-500 text-sm flex items-center gap-1 mb-6">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        {{ property.address_street }}, {{ property.address_number }} - {{ property.address_neighborhood }}, {{ property.address_city }}/{{ property.address_state }}
      </p>

      <div class="text-3xl font-extrabold text-gray-900 mb-8">
        R$ {{ formatPrice(property.sale_price) }}
      </div>

      <!-- Features Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <i class="fas fa-bed text-blue-600 text-3xl mb-2"></i>
          <span class="text-xl font-bold">{{ property.bedrooms }}</span>
          <span class="text-xs text-gray-500">Quartos</span>
        </div>
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <i class="fas fa-house text-blue-600 text-3xl mb-2"></i>
          <span class="text-xl font-bold">{{ property.suites }}</span>
          <span class="text-xs text-gray-500">Suítes</span>
        </div>
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <i class="fas fa-bath text-blue-600 text-3xl mb-2"></i>
          <span class="text-xl font-bold">{{ property.bathrooms }}</span>
          <span class="text-xs text-gray-500">Banheiros</span>
        </div>
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <i class="fas fa-car text-blue-600 text-3xl mb-2"></i>
          <span class="text-xl font-bold">{{ property.garage_spots }}</span>
          <span class="text-xs text-gray-500">Vagas</span>
        </div>
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          <span class="text-xl font-bold">{{ property.land_area }}</span>
          <span class="text-xs text-gray-500">Terreno (m²)</span>
        </div>
        <div class="flex flex-col items-center text-center p-4 bg-gray-50 rounded-xl">
          <svg class="w-8 h-8 text-blue-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          <span class="text-xl font-bold">{{ property.built_area }}</span>
          <span class="text-xs text-gray-500">Construída (m²)</span>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-10">
        <h2 class="text-xl font-bold text-gray-900 mb-3">Sobre o imóvel</h2>
        <p class="text-gray-600 leading-relaxed">{{ property.description }}</p>
      </div>

      <!-- Address -->
      <div class="mb-10">
        <h2 class="text-xl font-bold text-gray-900 mb-3">Endereço</h2>
        <p class="text-gray-600">
          {{ property.address_street }}, {{ property.address_number }} {{ property.address_complement ? '- ' + property.address_complement : '' }}<br>
          {{ property.address_neighborhood }} - {{ property.address_city }}/{{ property.address_state }}<br>
          CEP: {{ property.address_zip }}
        </p>
      </div>

      <!-- Owner Info (Private) -->
      <div class="mb-10 bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          Dados do Proprietário
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-sm text-gray-500">Nome</p>
            <p class="font-semibold text-gray-900">{{ property.owner?.name || 'Não informado' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Telefone</p>
            <p class="font-semibold text-gray-900">{{ property.owner?.phone || 'Não informado' }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-semibold text-gray-900">{{ property.owner?.email || 'Não informado' }}</p>
          </div>
        </div>
      </div>

      <!-- Gallery -->
      <div v-if="photos.length" class="mb-10">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Galeria de Fotos</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <div
            v-for="(photo, index) in photos"
            :key="photo.id"
            class="aspect-square bg-gray-100 rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition"
            @click="openLightbox(index)"
          >
            <img :src="`/storage/${photo.path}`" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </main>

    <!-- Lightbox -->
    <Teleport to="body">
      <div
        v-if="lightboxOpen"
        class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        @click.self="closeLightbox"
      >
        <button
          @click="closeLightbox"
          class="absolute top-4 right-4 text-white/80 hover:text-white z-10 p-2"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <button
          @click="prevPhoto"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <img
          v-if="photos[lightboxIndex]"
          :src="`/storage/${photos[lightboxIndex].path}`"
          class="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
        />
        <button
          @click="nextPhoto"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-white/80 hover:text-white p-2"
        >
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
        </button>
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">
          {{ lightboxIndex + 1 }} / {{ photos.length }}
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
// Ficha interna: carrega o imóvel pelo id e controla o lightbox das fotos.
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import axios from '../api';

const route = useRoute();
const property = ref(null);
const loading = ref(true);
const lightboxOpen = ref(false);
const lightboxIndex = ref(0);

// Capa: a foto com is_main ou, se nenhuma estiver marcada, a primeira.
const mainPhoto = computed(() => property.value?.photos?.find(p => p.is_main) || property.value?.photos?.[0] || null);
const photos = computed(() => property.value?.photos || []);

// Preço no formato brasileiro, sem o "R$" (o símbolo está no template).
function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR');
}

// Abre o WhatsApp com o link público do imóvel.
function shareWhatsApp() {
  const url = `${window.location.origin}/p/${property.value.slug}`;
  const text = `Olá! Confira este imóvel: ${property.value.title}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}%0A%0A${url}`, '_blank');
}

// Abre a foto em tela cheia e trava a rolagem da página de trás.
function openLightbox(index) {
  lightboxIndex.value = index;
  lightboxOpen.value = true;
  document.body.style.overflow = 'hidden';
}

// Fecha a tela cheia e devolve a rolagem.
function closeLightbox() {
  lightboxOpen.value = false;
  document.body.style.overflow = '';
}

// Próxima foto. Na última, volta para a primeira.
function nextPhoto() {
  if (lightboxIndex.value < photos.value.length - 1) {
    lightboxIndex.value++;
  } else {
    lightboxIndex.value = 0;
  }
}

// Foto anterior. Na primeira, vai para a última.
function prevPhoto() {
  if (lightboxIndex.value > 0) {
    lightboxIndex.value--;
  } else {
    lightboxIndex.value = photos.value.length - 1;
  }
}

// Atalhos do teclado, só enquanto o lightbox está aberto.
function onKeydown(e) {
  if (!lightboxOpen.value) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
}

// Busca o imóvel pelo id da URL. 404 ou erro de rede deixa a tela de "não encontrado".
onMounted(async () => {
  window.addEventListener('keydown', onKeydown);
  try {
    const { data } = await axios.get(`/api/properties/${route.params.id}`);
    property.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// Ao sair da tela, tira o listener do teclado e libera a rolagem, se o lightbox ficou aberto.
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.body.style.overflow = '';
});
</script>
