# Frontend — Gannam & Lage Vendas

Documentação das telas deste sistema, escrita para quem faz manutenção sem precisar adivinhar o que cada arquivo Vue desenha. O frontend é a parte que roda no navegador.

As pastas `node_modules` e `public/build` não fazem parte desta documentação. A primeira são bibliotecas prontas. A segunda é o JavaScript já compilado para produção.

## O que este frontend faz

São as telas da equipe e a página que o cliente abre pelo link. A equipe pesquisa imóveis, cadastra, edita, publica, vende, duplica e manda o link no WhatsApp. O cliente vê fotos, preço e descrição, sem login e sem o telefone do proprietário.

Não há um HTML separado por tela. O Laravel entrega uma página só (`resources/views/app.blade.php`) e o Vue troca o conteúdo conforme a URL, sem recarregar o site inteiro. Isso se chama aplicação de página única.

Tecnologias usadas de verdade:

- **Vue 3** — desenha as telas. Os arquivos `.vue` juntam HTML, lógica e, quando precisa, CSS.
- **Vue Router** — decide qual tela abre em cada endereço.
- **Pinia** — guarda quem está logado enquanto a aba está aberta.
- **Axios** — faz os pedidos HTTP para a API Laravel.
- **Tailwind** — classes visuais (`bg-blue-600`, `rounded-lg`, etc.) escritas direto no HTML.
- **SweetAlert2** — janelas de confirmação (vender, excluir, duplicar).
- **Font Awesome** — ícones de cama, banheiro e casa.

## Como a tela sobe

1. O navegador pede qualquer endereço do site.
2. `routes/web.php` responde com `app.blade.php`.
3. Essa página tem `<div id="app">` e carrega `resources/js/app.js` pelo Vite.
4. `app.js` cria a aplicação Vue, liga Pinia, o router, os alertas e monta `App.vue` dentro da div.
5. `App.vue` coloca `Layout.vue` em volta. O `Layout` tem o `<router-view>` que desenha a página da URL.
6. Antes de entrar numa rota, `resources/js/router/index.js` olha se a tela exige login. Sem token, manda para `/login`.

O `router-view` que está dentro de `App.vue` não aparece. O `Layout` não declara `<slot>`, então o conteúdo passado para ele é descartado. Quem mostra a página é o `router-view` do próprio `Layout.vue`.

## Mapa das telas

| Endereço | Nome interno | Arquivo | Quem acessa |
| --- | --- | --- | --- |
| `/login` | `login` | `pages/Login.vue` | Visitante. Se já houver token, vai para o painel |
| `/` | `dashboard` | `pages/Dashboard.vue` | Equipe logada |
| `/properties/create` | `properties.create` | `pages/PropertyForm.vue` | Equipe logada |
| `/properties/:id/edit` | `properties.edit` | `pages/PropertyForm.vue` | Equipe logada |
| `/properties/:id/view` | `properties.view` | `pages/PropertyView.vue` | Equipe logada |
| `/p/:slug` | `landing` | `pages/LandingPage.vue` | Qualquer pessoa, sem login |

O `:id` é o número do imóvel. O `:slug` é o texto da URL pública, por exemplo `casa-no-centro-64f1a2`.

A proteção não está no Vue como senha: está no token. O router só esconde a tela. A API, no servidor, é quem recusa o pedido se o token for inválido.

## Login e o token

Arquivo: `resources/js/stores/auth.js`.

Foi criado para as telas não precisarem, cada uma, saber como guardar a sessão. Pinia é a memória compartilhada. O token também fica no `localStorage` do navegador, com a chave `token`, para sobreviver a um F5.

O que o store guarda:

- `token` — a chave de acesso. Se existe, `isAuthenticated` é verdadeiro.
- `user` — nome, e-mail e id, carregados depois.
- `ready` — verdadeiro quando a conferência inicial terminou. O `Layout` espera isso para não piscar a barra do topo.

Funções:

- `login` — pede primeiro `/sanctum/csrf-cookie` (cookie de segurança do Laravel) e depois `POST /api/login` com e-mail e senha. Guarda o token, coloca o cabeçalho `Authorization: Bearer ...` em todos os próximos pedidos e busca o usuário.
- `fetchUser` — `GET /api/user`. Se a resposta for 401, apaga o token. Erro de rede ou erro 500 não desloga: o token permanece para a pessoa não cair fora por uma falha passageira do servidor.
- `logout` — limpa memória e `localStorage` na hora e, em seguida, avisa `POST /api/logout` para o servidor apagar o token. Se esse aviso falhar, a tela já está deslogada mesmo assim.

Ao abrir o site, se já houver token salvo, o cabeçalho Authorization é configurado antes de qualquer tela pedir dados.

## Como as telas falam com a API

Dois arquivos configuram o Axios:

- `resources/js/bootstrap.js` — configuração antiga/geral: cookie, cabeçalho `X-Requested-With`, e a remoção do `Content-Type` quando o corpo é `FormData`. Também publica `window.axios`.
- `resources/js/api.js` — o cliente que as telas importam. Repete essa configuração e ainda fixa `Accept: application/json`.

A remoção do `Content-Type` no envio de fotos é proposital. Se o JavaScript fixar `multipart/form-data` sem o boundary, o PHP recebe o arquivo vazio. Deixando o cabeçalho em branco, o navegador escreve o boundary correto. Foi criado por causa de falha real de upload.

As telas chamam caminhos como `/api/properties`. O Axios usa a mesma origem do site, então em desenvolvimento e em produção a API é o próprio Laravel.

## Arquivos do frontend

### `resources/js/app.js`

Ponto de entrada. Existe para ser o único arquivo que o Blade carrega. Liga, nesta ordem: Pinia, router, SweetAlert2 e vue3-toastify (avisos no canto, 3 segundos, canto superior direito). Monta `App.vue` em `#app`. Também puxa o CSS do Font Awesome e o `bootstrap.js`.

### `resources/js/bootstrap.js`

Prepara o Axios global. As páginas não importam este arquivo direto; o `app.js` importa. A configuração que as páginas usam de fato está duplicada em `api.js`.

### `resources/js/api.js`

Cliente HTTP das telas. Existe separado do `bootstrap.js` para cada página importar um Axios já com os cabeçalhos certos, inclusive o tratamento de upload.

### `resources/js/router/index.js`

Tabela de endereços e a trava de login. Existe para a URL poder ser copiada e aberta de novo (`/properties/12/edit` continua sendo a edição do 12).

`beforeEach` roda antes de cada troca de tela:

- rota com `requiresAuth` e sem token → `/login`;
- rota com `guest` (a de login) e com token → painel;
- o resto passa, inclusive `/p/:slug`.

As páginas são carregadas com `import()` só quando a rota é aberta, para o primeiro download não trazer todas as telas.

### `resources/js/stores/auth.js`

Memória de login, descrita na seção “Login e o token”.

### `resources/js/components/App.vue`

Primeiro componente. Só envolve a aplicação com o `Layout`. Foi criado como raiz única, o alvo de `app.mount('#app')`.

### `resources/js/components/Layout.vue`

Moldura: fundo cinza e, quando faz sentido, a barra de cima.

A barra (logo, “Novo Imóvel” e “Sair”) aparece só se o store já terminou a conferência, existe token e a rota não é a de login. Na landing pública a barra fica oculta porque não há token.

“Sair” chama `authStore.logout()` e depois vai para `/login` com recarregamento completo (`window.location`). O recarregamento limpa o que ainda estiver na memória do Vue. A variável `router` é criada neste arquivo, mas o sair não a usa.

O `<router-view>` dentro de `<main>` é onde login, painel, formulário, ficha e landing aparecem.

### `resources/js/pages/Login.vue`

Tela `/login`. Existe para ser a porta da equipe. Não há cadastro de usuário nesta tela: o usuário já precisa existir na tabela `users`.

O formulário guarda e-mail e senha e chama `authStore.login`. Sucesso leva ao painel. Falha mostra a mensagem que a API devolveu, ou “Erro ao autenticar.” O botão fica desabilitado enquanto o pedido não volta.

### `resources/js/pages/Dashboard.vue`

Painel, rota `/`. É a tela de trabalho: a lista de imóveis.

O que ela mostra:

- nome e iniciais de quem está logado;
- campo de busca livre (o texto é interpretado no servidor, não aqui);
- botões de status: todas, disponíveis, reservadas, vendidas, rascunhos;
- painel lateral de filtros (tipo, preço, condomínio, IPTU, quartos, suítes, banheiros, vagas, áreas, cidade e bairro);
- quantidade por página (10, 15, 25, 30 ou 50);
- cards com capa, etiqueta de status, preço, título, cidade e atalhos.

Ações de cada card, todas com confirmação do SweetAlert, exceto WhatsApp e os links de ver/editar:

- Publicar — `PUT /api/properties/{id}` só com `status: available`. Aparece para rascunho.
- Vender — `POST /api/properties/{id}/sell`.
- Duplicar — `POST /api/properties/{id}/duplicate`.
- Excluir — `DELETE /api/properties/{id}`.
- WhatsApp — abre `wa.me` com o título e o link `https://.../p/{slug}`. Não passa pela API.

`fetchProperties` manda só os filtros preenchidos. Para cada imóvel, escolhe `main_photo`: a foto com `is_main` ou a primeira. A paginação mostra no máximo cinco números, em volta da página atual. Trocar status ou itens por página volta para a página 1.

A lista é carregada quando a tela abre (`onMounted`).

### `resources/js/pages/PropertyForm.vue`

Cadastro e edição no mesmo arquivo. Existe assim para não haver dois formulários iguais. Se a URL tem `:id`, é edição; se não tem, é imóvel novo.

Abas:

- **Imóvel** — tipo (botões), áreas, descrição, preço, condomínio, IPTU, cômodos, endereço e título.
- **Proprietário** — nome, telefone e e-mail. Vão no JSON como objeto `owner`.
- **Fotos** — uma capa e uma galeria. Arquivos novos ficam na memória do navegador até o salvar. Fotos já gravadas aparecem na edição e podem ser apagadas na hora, com `DELETE /api/properties/{id}/photos/{foto}`.
- **Link** — prévia do endereço público e botão de copiar.

Salvar (`saveAndGenerateLink`):

1. Exige título, preço de venda maior que zero e tipo. Se faltar, avisa e tenta ir para a aba Imóvel.
2. `POST /api/properties` se for novo, ou `PUT /api/properties/{id}` se for edição.
3. Se houver capa nova, envia um `FormData` com `is_main = 1`.
4. Se houver galeria nova, envia outro `FormData`, sem marcar capa.
5. Volta ao painel.

Na edição, ao abrir, `GET /api/properties/{id}` preenche o formulário, a miniatura da capa e a galeria (a capa não entra de novo na galeria).

Dois detalhes que mudam o que a pessoa vê:

- A prévia do link é montada no navegador a partir do título (`p/titulo-id`). O slug verdadeiro, com o código único, só existe depois que o servidor grava. “Copiar link” copia essa prévia, não obrigatoriamente a URL final.
- Quando faltam campos, o código faz `tab.value = 'property'`. A aba de verdade está em `currentTab`. `tab` não existe, então o alerta aparece, mas a tela não muda de aba sozinha.

### `resources/js/pages/PropertyView.vue`

Ficha interna, rota `/properties/:id/view`. Existe para a equipe revisar o anúncio, com o proprietário visível, antes de mandar o link.

Carrega `GET /api/properties/{id}` (exige login, traz o dono). Mostra capa, preço, endereço, cômodos, descrição e galeria. “Ver Landing Page” abre `/p/{slug}` em outra aba. WhatsApp usa o mesmo link público do painel.

O lightbox é a foto em tela cheia. Clique na imagem abre, as setas do teclado trocam, Esc fecha, e na última foto a próxima volta para a primeira. Enquanto está aberto, a rolagem da página de trás fica travada. Ao sair da ficha, o listener do teclado é removido.

### `resources/js/pages/LandingPage.vue`

Página do cliente, rota `/p/:slug`. Foi criada para o link de WhatsApp não pedir senha e não mostrar telefone do dono.

Carrega `GET /api/public/properties/{slug}`. Rascunho ou slug errado caem em “Imóvel não encontrado”. O lightbox é o mesmo comportamento da ficha interna.

A prévia que o WhatsApp mostra (título, descrição e foto grande) não é feita por este Vue. Ela vem das meta tags de `app.blade.php`, preenchidas no PHP em `routes/web.php`, porque o WhatsApp lê o HTML antes do JavaScript rodar.

### `resources/css/app.css`

CSS de entrada do Tailwind. Diz ao compilador para olhar os `.vue`, `.js` e `.blade.php` em busca das classes usadas. Não há estilo de tela escrito aqui: o visual está nas classes de cada componente. A landing e o painel dependem deste arquivo estar incluído pelo `@vite` do Blade.

### `resources/views/app.blade.php`

HTML hospedeiro, documentado também no backend. No frontend, o que importa é a `div#app` e a carga de `resources/js/app.js` junto com este CSS.

### `vite.config.js`

Configuração do Vite, a ferramenta que junta Vue, JS e CSS. Em desenvolvimento, `npm run dev` serve os arquivos com recarga automática. Em produção, `npm run build` gera `public/build`, e o Blade passa a usar esses arquivos compilados.

## Fluxos do dia a dia

### Entrar

`/login` → store pede o cookie do Sanctum e depois `POST /api/login` → token no navegador → painel.

### Cadastrar e publicar

“Novo Imóvel” → preencher abas → salvar (nasce como rascunho no servidor, se o status não for mudado) → no painel, filtro Rascunhos → Publicar. Aí o status vira `available` e `/p/{slug}` passa a abrir.

### Mandar ao cliente

No card ou na ficha, WhatsApp. O texto leva o título e a URL `/p/{slug}`. O cliente vê a landing. A equipe continua vendo o dono só na ficha interna.

### Vender

Botão Vender no card. O imóvel permanece na lista, no filtro Vendidas. O link público continua abrindo, porque o servidor só esconde rascunho.

### Duplicar

Cria outro imóvel em rascunho, com fotos copiadas. Útil para um imóvel parecido sem redigitar. O original não muda.

## Pontos que o técnico precisa conhecer

- Sem `php artisan storage:link`, as fotos salvam no disco mas a tela mostra imagem quebrada. A URL `/storage/...` depende desse link.
- O IPTU aparece no formulário e vai no JSON, mas o model do servidor não grava a coluna. O campo volta vazio na próxima edição. A correção é no backend (`$fillable` de `Property`), não nesta tela.
- `tab.value` no salvar do formulário não troca a aba. A variável certa é `currentTab`.
- A prévia de link da aba Link não é o slug definitivo.
- `App.vue` tem um `router-view` que não é exibido. A página sai do `router-view` do `Layout.vue`.
- `bootstrap.js` e `api.js` repetem a mesma configuração do Axios. As páginas usam `api.js`.
- A landing de um imóvel vendido continua no ar. Esconder vendido exigiria mudança na rota pública do servidor, não só nesta tela.
