<!--
  Painel principal (rota /, nome "dashboard"). Exige login.

  É a lista de imóveis da equipe. Mostra cards com foto, preço, cidade
  e botões de ação. Os dados vêm de GET /api/properties.

  O que a pessoa pode fazer aqui:
    - buscar por texto (a frase é interpretada no PropertyController);
    - filtrar por status (disponível, reservado, vendido, rascunho);
    - abrir o painel lateral de filtros (preço, IPTU, cômodos, área, cidade);
    - paginar e escolher quantos cards por página;
    - publicar, vender, duplicar, excluir, editar, ver e compartilhar no WhatsApp.

  Publicar muda o status para available. Vender muda para sold.
  O link do WhatsApp aponta para a landing pública /p/{slug}.
-->
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Imóveis</h1>
        <p class="text-gray-500 text-sm mt-1">Gerenciamento de imóveis</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="text-right hidden sm:block">
          <p class="text-sm font-semibold text-gray-900">{{ userName }}</p>
          <p class="text-xs text-gray-500">{{ userEmail }}</p>
        </div>
        <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
          {{ userInitials }}
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ex: casa 400000-800000 ou apartamento iptu 500"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            @keyup.enter="searchProperties"
          />
          <svg class="w-5 h-5 text-gray-400 absolute right-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          @click="searchProperties"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-blue-700 transition inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          BUSCAR
        </button>
        <button
          @click="filterDrawerOpen = true"
          class="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition inline-flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          FILTROS
        </button>
      </div>

      <!-- Status Filters -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="filter in statusFilters"
          :key="filter.value"
          @click="currentStatus = filter.value"
          :class="[
            'px-4 py-1.5 rounded-full text-sm font-medium transition',
            currentStatus === filter.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ filter.label }}
        </button>
      </div>

      <!-- Results Info & Per Page -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
        <p class="text-sm text-gray-500">
          <span class="font-semibold text-gray-900">{{ pagination.total }}</span> imóvel<span v-if="pagination.total !== 1">(eis)</span> encontrado<span v-if="pagination.total !== 1">s</span>
        </p>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-500">Itens por página:</label>
          <select v-model="perPage" class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option :value="10">10</option>
            <option :value="15">15</option>
            <option :value="25">25</option>
            <option :value="30">30</option>
            <option :value="50">50</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Filter Drawer -->
    <Teleport to="body">
      <Transition name="slide">
        <div v-if="filterDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
          <!-- Overlay -->
          <div class="absolute inset-0 bg-black/40" @click="filterDrawerOpen = false"></div>
          <!-- Drawer Panel -->
          <div class="relative w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
            <div class="p-6">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-xl font-bold text-gray-900">Filtros de Imóveis</h2>
                <button @click="filterDrawerOpen = false" class="text-gray-400 hover:text-gray-600 p-1">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <!-- Tipo do Imóvel -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo do Imóvel</label>
                <select v-model="filters.property_type" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Todos</option>
                  <option value="casa">Casa</option>
                  <option value="apartamento">Apartamento</option>
                  <option value="sobrado">Sobrado</option>
                  <option value="terreno">Terreno</option>
                  <option value="comercial">Comercial</option>
                </select>
              </div>

              <!-- Faixa de Preço -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Faixa de Preço</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.min_price" type="number" placeholder="Mínimo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.max_price" type="number" placeholder="Máximo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- Condomínio -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Condomínio</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.min_condo_price" type="number" placeholder="Mínimo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.max_condo_price" type="number" placeholder="Máximo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- IPTU -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">IPTU Anual</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.min_iptu" type="number" placeholder="Mínimo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="filters.max_iptu" type="number" placeholder="Máximo" class="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <!-- Quartos -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Quartos</label>
                <div class="flex gap-2">
                  <button
                    v-for="n in ['',1,2,3,4,'5+']"
                    :key="'bed-' + n"
                    @click="filters.bedrooms = n === '5+' ? 5 : n"
                    :class="[
                      'flex-1 py-2 rounded-lg text-sm font-medium transition border',
                      (n === '5+' ? filters.bedrooms === 5 : filters.bedrooms === n)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    {{ n || 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Suítes -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Suítes</label>
                <div class="flex gap-2">
                  <button
                    v-for="n in ['',1,2,3,4,'5+']"
                    :key="'suite-' + n"
                    @click="filters.suites = n === '5+' ? 5 : n"
                    :class="[
                      'flex-1 py-2 rounded-lg text-sm font-medium transition border',
                      (n === '5+' ? filters.suites === 5 : filters.suites === n)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    {{ n || 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Banheiros -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Banheiros</label>
                <div class="flex gap-2">
                  <button
                    v-for="n in ['',1,2,3,4,'5+']"
                    :key="'bath-' + n"
                    @click="filters.bathrooms = n === '5+' ? 5 : n"
                    :class="[
                      'flex-1 py-2 rounded-lg text-sm font-medium transition border',
                      (n === '5+' ? filters.bathrooms === 5 : filters.bathrooms === n)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    {{ n || 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Vagas -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Vagas de Garagem</label>
                <div class="flex gap-2">
                  <button
                    v-for="n in ['',1,2,3,4,'5+']"
                    :key="'garage-' + n"
                    @click="filters.garage_spots = n === '5+' ? 5 : n"
                    :class="[
                      'flex-1 py-2 rounded-lg text-sm font-medium transition border',
                      (n === '5+' ? filters.garage_spots === 5 : filters.garage_spots === n)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400',
                    ]"
                  >
                    {{ n || 'Todos' }}
                  </button>
                </div>
              </div>

              <!-- Área do Terreno -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Área do Terreno (m²)</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="relative">
                    <input v-model="filters.min_land_area" type="number" placeholder="Mínimo" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span class="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
                  </div>
                  <div class="relative">
                    <input v-model="filters.max_land_area" type="number" placeholder="Máximo" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span class="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
                  </div>
                </div>
              </div>

              <!-- Área Construída -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Área Construída (m²)</label>
                <div class="grid grid-cols-2 gap-3">
                  <div class="relative">
                    <input v-model="filters.min_built_area" type="number" placeholder="Mínimo" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span class="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
                  </div>
                  <div class="relative">
                    <input v-model="filters.max_built_area" type="number" placeholder="Máximo" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <span class="absolute right-3 top-2.5 text-gray-500 text-sm">m²</span>
                  </div>
                </div>
              </div>

              <!-- Cidade -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Cidade</label>
                <input v-model="filters.address_city" type="text" placeholder="Digite a cidade" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <!-- Bairro -->
              <div class="mb-6">
                <label class="block text-sm font-semibold text-gray-700 mb-2">Bairro</label>
                <input v-model="filters.address_neighborhood" type="text" placeholder="Digite o bairro" class="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <!-- Actions -->
              <div class="flex gap-3 pt-4 border-t">
                <button @click="clearFilters" class="flex-1 py-3 rounded-lg text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 transition">
                  Limpar
                </button>
                <button @click="applyFilters" class="flex-1 py-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition">
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Grid -->
    <div v-if="loading" class="text-center py-20">
      <p class="text-gray-500">Carregando imóveis...</p>
    </div>

    <div v-else-if="properties.length === 0" class="text-center py-20">
      <div class="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
      <p class="text-gray-500 text-lg">Nenhum imóvel encontrado</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div
        v-for="property in properties"
        :key="property.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group relative hover:shadow-md transition"
      >
        <!-- Image -->
        <div class="relative h-48 bg-gray-200 overflow-hidden">
          <img
            v-if="property.main_photo"
            :src="`/storage/${property.main_photo.path}`"
            class="w-full h-full object-cover transition group-hover:scale-105"
            alt="Foto do imóvel"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          <!-- Status Badge -->
          <span
            :class="[
              'absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white uppercase',
              statusColor(property.status),
            ]"
          >
            {{ statusLabel(property.status) }}
          </span>

          <!-- Hover Menu -->
          <div
            class="absolute inset-0 bg-black/70 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
          >
            <div class="grid grid-cols-2 gap-1 p-2">
              <button
                v-if="property.status === 'draft'"
                @click.stop="publishProperty(property)"
                class="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-green-600 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                Publicar
              </button>
              <router-link
                :to="{ name: 'properties.view', params: { id: property.id } }"
                class="bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-white/30 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                Visualizar
              </router-link>
              <a
                :href="`/p/${property.slug}`"
                target="_blank"
                class="bg-purple-600 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-purple-700 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Landing
              </a>
              <router-link
                :to="{ name: 'properties.edit', params: { id: property.id } }"
                class="bg-orange-500 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-orange-600 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                Editar
              </router-link>
              <button
                @click.stop="sellProperty(property)"
                class="bg-red-600 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-red-700 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Vender
              </button>
              <button
                @click.stop="duplicateProperty(property)"
                class="bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-blue-700 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                Duplicar
              </button>
              <button
                @click.stop="deleteProperty(property)"
                class="bg-gray-700 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-gray-800 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Excluir
              </button>
              <button
                @click.stop="shareWhatsApp(property)"
                class="bg-green-600 text-white px-2 py-1 rounded text-[10px] font-medium hover:bg-green-700 transition flex items-center justify-center gap-1"
              >
                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>

        <!-- Info -->
        <div class="p-4">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded">
              R$ {{ formatPrice(property.sale_price) }}
            </span>
          </div>
          <h3 class="font-semibold text-gray-900 mb-1 truncate">{{ property.title }}</h3>
          <p class="text-gray-500 text-sm flex items-center gap-1 mb-3">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {{ property.address_city }}/{{ property.address_state }}
          </p>
          <div class="flex items-center gap-4 text-xs text-gray-500">
            <span v-if="property.bedrooms" class="flex items-center gap-1">
              <i class="fas fa-bed text-sm"></i>
              {{ property.bedrooms }}
            </span>
            <span v-if="property.bathrooms" class="flex items-center gap-1">
              <i class="fas fa-bath text-sm"></i>
              {{ property.bathrooms }}
            </span>
            <span v-if="property.land_area" class="flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              {{ property.land_area }}m²
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination.last_page > 1" class="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
      <p class="text-sm text-gray-500">
        Mostrando <span class="font-medium text-gray-900">{{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} - {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }}</span> de <span class="font-medium text-gray-900">{{ pagination.total }}</span> imóveis
      </p>
      <div class="flex items-center gap-2">
        <button
          @click="goToPage(pagination.current_page - 1)"
          :disabled="pagination.current_page === 1"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium border transition',
            pagination.current_page === 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
          ]"
        >
          Anterior
        </button>

        <button
          v-for="p in pageNumbers"
          :key="p"
          @click="goToPage(p)"
          :class="[
            'w-10 h-10 rounded-lg text-sm font-medium border transition',
            p === pagination.current_page
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
          ]"
        >
          {{ p }}
        </button>

        <button
          @click="goToPage(pagination.current_page + 1)"
          :disabled="pagination.current_page === pagination.last_page"
          :class="[
            'px-3 py-2 rounded-lg text-sm font-medium border transition',
            pagination.current_page === pagination.last_page
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400',
          ]"
        >
          Próximo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Painel: busca a lista, aplica filtros e dispara as ações de cada card.
import { ref, reactive, watch, onMounted, computed } from 'vue';
import Swal from 'sweetalert2';
import axios from '../api';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

// Nome, e-mail e iniciais do usuário logado, mostrados no canto do título.
const userName = computed(() => authStore.user?.name || 'Usuário');
const userEmail = computed(() => authStore.user?.email || '');
const userInitials = computed(() => {
  const name = authStore.user?.name || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
});
// loading mostra o texto de espera. properties é a página atual de cards.
const loading = ref(true);
const properties = ref([]);
const searchQuery = ref('');
// currentStatus vazio significa "todas". Os outros valores batem com o banco.
const currentStatus = ref('');
const filterDrawerOpen = ref(false);
const page = ref(1);
const perPage = ref(25);
const pagination = ref({ current_page: 1, last_page: 1, total: 0, per_page: 25 });

// Filtros do painel lateral. Vazio significa "não filtrar este campo".
const filters = reactive({
  property_type: '',
  min_price: '',
  max_price: '',
  min_condo_price: '',
  max_condo_price: '',
  min_iptu: '',
  max_iptu: '',
  bedrooms: '',
  suites: '',
  bathrooms: '',
  garage_spots: '',
  min_land_area: '',
  max_land_area: '',
  min_built_area: '',
  max_built_area: '',
  address_city: '',
  address_neighborhood: '',
});

// Botões de status do topo da busca. value '' não envia filtro.
const statusFilters = [
  { label: 'Todas', value: '' },
  { label: 'Disponíveis', value: 'available' },
  { label: 'Reservadas', value: 'reserved' },
  { label: 'Vendidas', value: 'sold' },
  { label: 'Rascunhos', value: 'draft' },
];

// Traduz o status do banco para o texto da etiqueta do card.
function statusLabel(status) {
  const map = { draft: 'Rascunho', available: 'Disponível', reserved: 'Reservada', sold: 'Vendido' };
  return map[status] || status;
}

// Cor da etiqueta: cinza rascunho, verde disponível, amarelo reservado, vermelho vendido.
function statusColor(status) {
  const map = { draft: 'bg-gray-500', available: 'bg-green-500', reserved: 'bg-yellow-500', sold: 'bg-red-500' };
  return map[status] || 'bg-gray-500';
}

// Formata o preço no padrão brasileiro, sem o símbolo (o "R$" está no template).
function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR');
}

// Monta a query da API só com os filtros preenchidos e atualiza cards e paginação.
// main_photo escolhe a capa (is_main) ou, se não houver, a primeira foto.
async function fetchProperties() {
  loading.value = true;
  try {
    const params = {};
    if (searchQuery.value) params.search = searchQuery.value;
    if (currentStatus.value) params.status = currentStatus.value;

    if (filters.property_type) params.property_type = filters.property_type;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    if (filters.min_condo_price) params.min_condo_price = filters.min_condo_price;
    if (filters.max_condo_price) params.max_condo_price = filters.max_condo_price;
    if (filters.min_iptu) params.min_iptu = filters.min_iptu;
    if (filters.max_iptu) params.max_iptu = filters.max_iptu;
    if (filters.bedrooms !== '' && filters.bedrooms !== null) params.bedrooms = filters.bedrooms;
    if (filters.suites !== '' && filters.suites !== null) params.suites = filters.suites;
    if (filters.bathrooms !== '' && filters.bathrooms !== null) params.bathrooms = filters.bathrooms;
    if (filters.garage_spots !== '' && filters.garage_spots !== null) params.garage_spots = filters.garage_spots;
    if (filters.min_land_area) params.min_land_area = filters.min_land_area;
    if (filters.max_land_area) params.max_land_area = filters.max_land_area;
    if (filters.min_built_area) params.min_built_area = filters.min_built_area;
    if (filters.max_built_area) params.max_built_area = filters.max_built_area;
    if (filters.address_city) params.address_city = filters.address_city;
    if (filters.address_neighborhood) params.address_neighborhood = filters.address_neighborhood;

    params.page = page.value;
    params.per_page = perPage.value;

    const { data } = await axios.get('/api/properties', { params });
    properties.value = data.data.map(p => ({
      ...p,
      main_photo: p.photos?.find(ph => ph.is_main) || p.photos?.[0] || null,
    }));
    pagination.value = {
      current_page: data.current_page,
      last_page: data.last_page,
      total: data.total,
      per_page: data.per_page,
    };
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// Busca pelo texto. Volta para a página 1 para não ficar numa página que não existe mais.
function searchProperties() {
  page.value = 1;
  fetchProperties();
}

// Aplica o painel lateral e o fecha.
function applyFilters() {
  page.value = 1;
  filterDrawerOpen.value = false;
  fetchProperties();
}

// Zera todos os filtros laterais e busca de novo. O texto e o status do topo permanecem.
function clearFilters() {
  filters.property_type = '';
  filters.min_price = '';
  filters.max_price = '';
  filters.min_condo_price = '';
  filters.max_condo_price = '';
  filters.min_iptu = '';
  filters.max_iptu = '';
  filters.bedrooms = '';
  filters.suites = '';
  filters.bathrooms = '';
  filters.garage_spots = '';
  filters.min_land_area = '';
  filters.max_land_area = '';
  filters.min_built_area = '';
  filters.max_built_area = '';
  filters.address_city = '';
  filters.address_neighborhood = '';
  page.value = 1;
  filterDrawerOpen.value = false;
  fetchProperties();
}

// Troca de página, ignorando número menor que 1 ou maior que a última.
function goToPage(p) {
  if (p < 1 || p > pagination.value.last_page) return;
  page.value = p;
  fetchProperties();
}

// Números dos botões de página: no máximo 5, centralizados na página atual.
const pageNumbers = computed(() => {
  const pages = [];
  const maxVisible = 5;
  let start = Math.max(1, pagination.value.current_page - 2);
  let end = Math.min(pagination.value.last_page, start + maxVisible - 1);
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  return pages;
});

// Mudar "itens por página" recomeça na página 1.
watch(perPage, () => {
  page.value = 1;
  fetchProperties();
});

// Pede confirmação e marca o imóvel como vendido (POST /sell). Não apaga o registro.
async function sellProperty(property) {
  const result = await Swal.fire({
    title: 'Confirmar venda',
    text: 'Deseja marcar este imóvel como VENDIDO? Ele ficará oculto do grid principal.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, vender',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  if (!result.isConfirmed) return;
  try {
    await axios.post(`/api/properties/${property.id}/sell`);
    await fetchProperties();
    Swal.fire('Sucesso!', 'Imóvel marcado como vendido.', 'success');
  } catch (e) {
    Swal.fire('Erro', 'Erro ao vender imóvel.', 'error');
  }
}

// Pede confirmação e publica o rascunho (PUT só com status available).
async function publishProperty(property) {
  const result = await Swal.fire({
    title: 'Confirmar publicação',
    text: 'Publicar este imóvel? Ele ficará disponível na landing page pública.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, publicar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  });
  if (!result.isConfirmed) return;
  try {
    await axios.put(`/api/properties/${property.id}`, { status: 'available' });
    await fetchProperties();
    Swal.fire('Sucesso!', 'Imóvel publicado com sucesso.', 'success');
  } catch (e) {
    Swal.fire('Erro', 'Erro ao publicar imóvel.', 'error');
  }
}

// Pede confirmação e apaga o imóvel no servidor, inclusive os arquivos de foto.
async function deleteProperty(property) {
  const result = await Swal.fire({
    title: 'Confirmar exclusão',
    text: 'Deseja EXCLUIR permanentemente este imóvel? Esta ação não pode ser desfeita.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, excluir',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  if (!result.isConfirmed) return;
  try {
    await axios.delete(`/api/properties/${property.id}`);
    await fetchProperties();
    Swal.fire('Excluído!', 'Imóvel removido com sucesso.', 'success');
  } catch (e) {
    Swal.fire('Erro', 'Erro ao excluir imóvel.', 'error');
  }
}

// Pede confirmação e pede ao servidor uma cópia completa (dados, dono e fotos).
async function duplicateProperty(property) {
  const result = await Swal.fire({
    title: 'Duplicar imóvel',
    text: 'Deseja criar uma cópia completa deste imóvel? As fotos também serão copiadas.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, duplicar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#2563eb',
    cancelButtonColor: '#6b7280',
  });
  if (!result.isConfirmed) return;
  try {
    await axios.post(`/api/properties/${property.id}/duplicate`);
    await fetchProperties();
    Swal.fire('Sucesso!', 'Imóvel duplicado com sucesso.', 'success');
  } catch (e) {
    Swal.fire('Erro', 'Erro ao duplicar imóvel.', 'error');
  }
}

// Abre o WhatsApp com o título e o link público do imóvel já escritos.
function shareWhatsApp(property) {
  const url = `${window.location.origin}/p/${property.slug}`;
  const text = `Olá! Confira este imóvel: ${property.title}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}%0A%0A${url}`, '_blank');
}

// Trocar o filtro de status busca de novo a partir da página 1.
watch(currentStatus, () => {
  page.value = 1;
  fetchProperties();
});
// Primeira carga da lista, assim que a tela é exibida.
onMounted(fetchProperties);
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
