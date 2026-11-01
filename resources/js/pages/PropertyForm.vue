<!--
  Formulário de cadastro e de edição do imóvel.

  A mesma tela serve as duas rotas:
    /properties/create       — imóvel novo (não tem id na URL)
    /properties/:id/edit     — edição (o id vem da URL)

  Está dividida em quatro abas: Imóvel, Proprietário, Fotos e Link.
  Salvar manda os dados em JSON (POST se for novo, PUT se for edição)
  e, em seguida, envia as fotos novas em pedidos separados, porque
  arquivo não vai no mesmo JSON. A foto marcada como principal vai
  com is_main = 1; o servidor desenha a marca d'água.

  A aba Link mostra uma prévia do endereço público. Essa prévia é
  montada no navegador a partir do título. O slug definitivo, com o
  código único, só existe depois que o servidor grava o imóvel.
-->
<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center gap-3 mb-8">
      <button
        @click="$router.push({ name: 'dashboard' })"
        class="text-gray-500 hover:text-gray-700 transition"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
      </button>
      <div class="flex items-center gap-2">
        <div class="bg-blue-600 text-white p-2 rounded-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar Imóvel' : 'Novo Imóvel' }}</h1>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Form -->
      <div class="lg:col-span-2">
        <!-- Tabs -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="flex border-b border-gray-100">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              @click="currentTab = tab.key"
              :class="[
                'flex items-center gap-2 px-6 py-4 text-sm font-medium transition border-b-2',
                currentTab === tab.key
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50',
              ]"
            >
              <svg v-if="tab.key === 'property'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <svg v-else-if="tab.key === 'owner'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <svg v-else-if="tab.key === 'photos'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <svg v-else-if="tab.key === 'link'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              {{ tab.label }}
            </button>
          </div>

          <div class="p-6">
            <!-- Tab: Imóvel -->
            <div v-if="currentTab === 'property'" class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Tipo do Imóvel</label>
                <div class="grid grid-cols-3 sm:grid-cols-5 gap-3">
                  <button
                    v-for="type in propertyTypes"
                    :key="type.value"
                    @click="form.property_type = type.value"
                    :class="[
                      'flex flex-col items-center gap-1 p-3 rounded-lg border transition text-xs',
                      form.property_type === type.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600',
                    ]"
                  >
                    <svg v-if="['casa','sobrado','mansao','chale','casa_condominio'].includes(type.value)" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <svg v-else-if="['apartamento','cobertura','duplex','comercial','industrial'].includes(type.value)" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                    <span>{{ type.label }}</span>
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Área do Terreno (m²)</label>
                  <input v-model="form.land_area" type="number" step="0.01" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Área Construída (m²)</label>
                  <input v-model="form.built_area" type="number" step="0.01" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea v-model="form.description" rows="4" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Descreva o imóvel..."></textarea>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Valor de Venda</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="form.sale_price" type="number" step="0.01" class="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Condomínio</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="form.condo_price" type="number" step="0.01" class="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">IPTU Anual</label>
                  <div class="relative">
                    <span class="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                    <input v-model="form.iptu" type="number" step="0.01" class="w-full border rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Quartos</label>
                  <input v-model="form.bedrooms" type="number" min="0" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Suítes</label>
                  <input v-model="form.suites" type="number" min="0" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Banheiros</label>
                  <input v-model="form.bathrooms" type="number" min="0" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Vagas</label>
                  <input v-model="form.garage_spots" type="number" min="0" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div class="space-y-4">
                <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Endereço
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Estado *</label>
                    <input v-model="form.address_state" maxlength="2" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 uppercase" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Cidade *</label>
                    <input v-model="form.address_city" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                    <input v-model="form.address_neighborhood" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                    <input v-model="form.address_zip" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">Rua *</label>
                    <input v-model="form.address_street" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Número</label>
                    <input v-model="form.address_number" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                  <input v-model="form.address_complement" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <!-- Tab: Proprietário -->
            <div v-if="currentTab === 'owner'" class="space-y-4">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Proprietário - Vendedor
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input v-model="form.owner.name" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Nome completo do proprietário" required />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input v-model="form.owner.phone" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input v-model="form.owner.email" type="email" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>

            <!-- Tab: Fotos -->
            <div v-if="currentTab === 'photos'" class="space-y-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Foto Principal</label>
                <div
                  class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition relative"
                  @click="$refs.mainPhotoInput.click()"
                >
                  <input ref="mainPhotoInput" type="file" accept="image/*" class="hidden" @change="handleMainPhoto" />
                  <img v-if="mainPhotoPreview" :src="mainPhotoPreview" class="mx-auto h-40 object-contain rounded-lg" />
                  <div v-else>
                    <svg class="w-12 h-12 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    <p class="text-sm text-gray-500">Clique para adicionar foto principal</p>
                    <p class="text-xs text-gray-400 mt-1">Essa será a capa do imóvel</p>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Galeria de Fotos</label>
                <div class="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  <!-- Fotos existentes -->
                  <div
                    v-for="(photo, index) in existingPhotos"
                    :key="'existing-' + photo.id"
                    class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                  >
                    <img :src="photo.path" class="w-full h-full object-cover" />
                    <button
                      @click="removeExistingPhoto(photo.id, index)"
                      class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <!-- Fotos novas -->
                  <div
                    v-for="(photo, index) in galleryPreviews"
                    :key="'new-' + index"
                    class="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                  >
                    <img :src="photo" class="w-full h-full object-cover" />
                    <button
                      @click="removeGalleryPhoto(index)"
                      class="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <div
                    class="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition"
                    @click="$refs.galleryInput.click()"
                  >
                    <input ref="galleryInput" type="file" accept="image/*" multiple class="hidden" @change="handleGallery" />
                    <svg class="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    <span class="text-xs text-gray-500">Adicionar</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tab: Link -->
            <div v-if="currentTab === 'link'" class="space-y-4">
              <h3 class="font-semibold text-gray-900 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                Link do Imóvel
              </h3>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Link Personalizado</label>
                <div class="flex gap-2">
                  <input :value="slugPreview" readonly class="flex-1 border rounded-lg px-3 py-2 bg-gray-50 text-gray-600" />
                  <button @click="copyLink" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">Copiar</button>
                </div>
                <p class="text-xs text-gray-500 mt-1">Gerado automaticamente ao salvar</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Descrição do Anúncio</label>
                <textarea v-model="form.link_description" rows="3" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Descrição que aparecerá no compartilhar..."></textarea>
              </div>
            </div>

            <!-- Actions -->
            <div class="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
              <button
                @click="$router.push({ name: 'dashboard' })"
                class="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                @click="saveAndGenerateLink"
                class="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition inline-flex items-center gap-2"
                :disabled="saving"
              >
                <svg v-if="saving" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                {{ saving ? 'Salvando...' : 'Salvar e Gerar Link' }}
              </button>
              <a
                v-if="isEdit && form.slug"
                :href="`/p/${form.slug}`"
                target="_blank"
                class="px-5 py-2.5 rounded-lg bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                Ver Landing Page
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sticky top-6">
          <h3 class="text-sm font-semibold text-gray-700 mb-4 text-center">Preview</h3>
          <div class="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <div class="relative h-40 bg-gray-200">
              <img v-if="mainPhotoPreview" :src="mainPhotoPreview" class="w-full h-full object-cover" />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <span class="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded">{{ statusLabel(form.status || 'available') }}</span>
            </div>
            <div class="p-3">
              <div class="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded inline-block mb-2">
                R$ {{ formatPrice(form.sale_price || 0) }}
              </div>
              <div class="relative">
                <h4
                  v-if="!editingTitle"
                  @dblclick="startEditTitle"
                  class="font-semibold text-gray-900 text-sm truncate cursor-text hover:bg-blue-50 rounded px-1 -mx-1 transition"
                  title="Clique duplo para editar"
                >{{ form.title || 'Título do Imóvel' }}</h4>
                <input
                  v-else
                  ref="titleInput"
                  v-model="form.title"
                  @blur="editingTitle = false"
                  @keydown.enter="editingTitle = false"
                  class="w-full font-semibold text-gray-900 text-sm border border-blue-400 rounded px-1 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome do imóvel"
                />
              </div>
              <p class="text-gray-500 text-xs flex items-center gap-1 mt-1">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {{ form.address_city || 'Cidade' }}/{{ form.address_state || 'UF' }}
              </p>
              <div class="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span v-if="form.bedrooms" class="flex items-center gap-0.5">
                  <i class="fas fa-bed text-xs"></i>
                  {{ form.bedrooms }}
                </span>
                <span v-if="form.bathrooms" class="flex items-center gap-0.5">
                  <i class="fas fa-bath text-xs"></i>
                  {{ form.bathrooms }}
                </span>
                <span v-if="form.land_area" class="flex items-center gap-0.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  {{ form.land_area }}m²
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Formulário: carrega o imóvel na edição, guarda fotos novas e salva tudo.
import { reactive, ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import axios from '../api';

const route = useRoute();
const router = useRouter();
// Verdadeiro quando a URL tem id. Falso na rota de criar.
const isEdit = computed(() => !!route.params.id);
// Aba visível. Começa em "Imóvel".
const currentTab = ref('property');
const saving = ref(false);
// editingTitle liga o campo de texto do título no lugar do texto estático.
const editingTitle = ref(false);
const titleInput = ref(null);

// Abre a edição do título e, no próximo ciclo da tela, foca e seleciona o texto.
function startEditTitle() {
  editingTitle.value = true;
  nextTick(() => {
    titleInput.value?.focus();
    titleInput.value?.select();
  });
}

// Abas do formulário, na ordem em que aparecem.
const tabs = [
  { key: 'property', label: 'Imóvel' },
  { key: 'owner', label: 'Proprietário' },
  { key: 'photos', label: 'Fotos' },
  { key: 'link', label: 'Link' },
];

// Tipos oferecidos nos botões. O value é o que vai para property_type no banco.
const propertyTypes = [
  { value: 'casa', label: 'Casa' },
  { value: 'apartamento', label: 'Apartamento' },
  { value: 'sobrado', label: 'Sobrado' },
  { value: 'cobertura', label: 'Cobertura' },
  { value: 'duplex', label: 'Duplex' },
  { value: 'mansao', label: 'Mansão' },
  { value: 'chale', label: 'Chalé' },
  { value: 'casa_condominio', label: 'Casa em Condomínio' },
  { value: 'comercial', label: 'Comercial' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'terreno', label: 'Terreno' },
  { value: 'terreno_rural', label: 'Terreno Rural' },
  { value: 'fazenda', label: 'Fazenda' },
  { value: 'sito_chacara', label: 'Sítio/Chácara' },
  { value: 'propriedade_rural', label: 'Propriedade Rural' },
];

// Estado do formulário. Os nomes dos campos são os mesmos que a API espera.
// owner vai aninhado: o controller lê owner.name, owner.phone e owner.email.
const form = reactive({
  title: '',
  description: '',
  property_type: 'casa',
  land_area: '',
  built_area: '',
  sale_price: '',
  condo_price: 0,
  iptu: 0,
  bedrooms: 0,
  suites: 0,
  bathrooms: 0,
  garage_spots: 0,
  status: 'draft',
  address_street: '',
  address_number: '',
  address_complement: '',
  address_neighborhood: '',
  address_city: '',
  address_state: '',
  address_zip: '',
  owner: { name: '', phone: '', email: '' },
  link_description: '',
});

// Fotos escolhidas agora, ainda não enviadas. existingPhotos são as que já estão no servidor.
const mainPhotoFile = ref(null);
const mainPhotoPreview = ref(null);
const galleryFiles = ref([]);
const galleryPreviews = ref([]);
const existingPhotos = ref([]);

// Prévia local do endereço /p/.... Não é o slug gravado; o servidor gera outro, com uniqid.
const slugPreview = computed(() => {
  if (!form.title) return 'p/titulo-do-imovel-id';
  return `p/${form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${isEdit.value ? route.params.id : 'novo'}`;
});

// Texto do status para a etiqueta da aba Link.
function statusLabel(status) {
  const map = { draft: 'Rascunho', available: 'Disponível', reserved: 'Reservada', sold: 'Vendido' };
  return map[status] || status;
}

// Preço formatado em pt-BR, usado na prévia.
function formatPrice(value) {
  return Number(value).toLocaleString('pt-BR');
}

// Guarda a foto principal escolhida e gera um endereço temporário para a miniatura.
function handleMainPhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  mainPhotoFile.value = file;
  mainPhotoPreview.value = URL.createObjectURL(file);
}

// Acrescenta as fotos da galeria sem apagar as que já tinham sido escolhidas.
function handleGallery(e) {
  const files = Array.from(e.target.files);
  files.forEach(file => {
    galleryFiles.value.push(file);
    galleryPreviews.value.push(URL.createObjectURL(file));
  });
}

// Tira uma foto nova da fila, antes do envio. Não chama a API.
function removeGalleryPhoto(index) {
  galleryFiles.value.splice(index, 1);
  galleryPreviews.value.splice(index, 1);
}

// Apaga no servidor uma foto que já estava salva e tira ela da lista da tela.
async function removeExistingPhoto(id, index) {
  const result = await Swal.fire({
    title: 'Remover foto?',
    text: 'Deseja remover esta foto permanentemente?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sim, remover',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#dc2626',
    cancelButtonColor: '#6b7280',
  });
  if (!result.isConfirmed) return;
  try {
    await axios.delete(`/api/properties/${route.params.id}/photos/${id}`);
    existingPhotos.value.splice(index, 1);
    Swal.fire('Removida!', 'Foto removida com sucesso.', 'success');
  } catch (e) {
    Swal.fire('Erro', 'Não foi possível remover a foto.', 'error');
  }
}

// Copia a prévia do link. É a prévia local, não necessariamente o slug final.
function copyLink() {
  navigator.clipboard.writeText(`${window.location.origin}/${slugPreview.value}`);
  Swal.fire('Copiado!', 'Link copiado para a área de transferência.', 'success');
}

// Confere título, preço e tipo, grava o imóvel e só então envia as fotos.
// Se faltar campo, avisa e tenta voltar para a aba Imóvel.
async function saveAndGenerateLink() {
  // Validar campos obrigatórios antes de enviar
  const missing = [];
  if (!form.title?.trim()) missing.push('Título do Imóvel');
  if (!form.sale_price || Number(form.sale_price) <= 0) missing.push('Preço de Venda');
  if (!form.property_type?.trim()) missing.push('Tipo do Imóvel');

  if (missing.length) {
    Swal.fire({
      icon: 'warning',
      title: 'Campos obrigatórios',
      html: 'Preencha os seguintes campos na aba <b>Imóvel</b>:<br>' + missing.join('<br>'),
      confirmButtonText: 'Ir para aba Imóvel',
    }).then(() => {
      // Deveria ser currentTab.value. "tab" não existe neste arquivo,
      // então o aviso aparece, mas a troca de aba não acontece.
      tab.value = 'property';
    });
    return;
  }

  saving.value = true;
  try {
    let property;
    if (isEdit.value) {
      const { data } = await axios.put(`/api/properties/${route.params.id}`, form);
      property = data;
    } else {
      const { data } = await axios.post('/api/properties', form);
      property = data;
    }

    // Foto de capa: um arquivo só, marcado como principal.
    if (mainPhotoFile.value) {
      const fd = new FormData();
      fd.append('photos[]', mainPhotoFile.value);
      fd.append('is_main', '1');
      await axios.post(`/api/properties/${property.id}/photos`, fd);
    }

    // Galeria: todas as fotos novas num único envio, sem marcar capa.
    if (galleryFiles.value.length) {
      const fd = new FormData();
      galleryFiles.value.forEach(f => fd.append('photos[]', f));
      await axios.post(`/api/properties/${property.id}/photos`, fd);
    }

    router.push({ name: 'dashboard' });
  } catch (e) {
    Swal.fire('Erro', e.response?.data?.message || 'Erro ao salvar imóvel.', 'error');
  } finally {
    saving.value = false;
  }
}

// Na edição, busca o imóvel e preenche o formulário, a capa e a galeria já salvas.
onMounted(async () => {
  if (isEdit.value) {
    try {
      const { data } = await axios.get(`/api/properties/${route.params.id}`);
      Object.assign(form, {
        ...data,
        owner: data.owner || { name: '', phone: '', email: '' },
      });
      // Capa já existente: mostra o arquivo do servidor, sem marcar como arquivo novo.
      const mainPhoto = data.photos?.find(p => p.is_main);
      if (mainPhoto) {
        mainPhotoPreview.value = `/storage/${mainPhoto.path}`;
      }
      // Galeria já existente, sem a capa, para não aparecer duas vezes.
      existingPhotos.value = data.photos?.filter(p => !p.is_main).map(p => ({
        id: p.id,
        path: `/storage/${p.path}`,
      })) || [];
    } catch (e) {
      console.error(e);
    }
  }
});
</script>
