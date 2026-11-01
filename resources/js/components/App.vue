<!--
  Componente raiz da aplicação Vue.

  É o primeiro componente montado dentro da div #app (ver app.js).
  Só coloca o Layout em volta da aplicação. Quem desenha a página da
  URL é o <router-view> que está dentro de Layout.vue. O router-view
  daqui é passado como conteúdo interno do Layout, e o Layout não
  declara um <slot>, então este segundo router-view não é exibido.
-->
<template>
  <Layout>
    <router-view />
  </Layout>
</template>

<script setup>
import Layout from './Layout.vue';
</script>
