# Primeira entrega React mobile-first

A branch `feat/react-mobile-first` migra as cinco telas Vue para React e TypeScript. A entrega mantém o Laravel 12, os endpoints e as rotas existentes, incluindo `/p/{slug}`. A navegação interna oferece Imóveis, Buscar e Cadastrar, com barra inferior em telas menores. O painel reúne busca, filtros, ordenação e ações acessíveis por toque.

## Mudanças por fase

| Fase | Entrega |
| --- | --- |
| Estrutura | React Router, TanStack Query, integração Vite/Blade e autenticação Sanctum |
| Mobile e cartões | Menu compacto, navegação inferior, áreas de toque de 44 px, suporte às safe areas e ações por status |
| Busca | Debounce de 350 ms, cancelamento, filtros principais e avançados, chips, ordenação estável, paginação e persistência na URL |
| Compartilhamento | Slug do servidor, WhatsApp, copiar link, Web Share e Open Graph gerado pelo Blade |
| Qualidade | Testes de regressão em seis resoluções com Laravel, SQLite temporário e fotos de teste |

## Correções

- O botão de copiar no formulário usava um endereço provisório. Agora, o compartilhamento usa o slug gravado e fica disponível após a publicação.
- O IPTU validado pelo controller era descartado pelo modelo na gravação em massa. Agora ele é gravado na coluna existente.
- A validação do formulário tentava abrir a aba Imóvel por meio de uma variável inexistente. O formulário React abre a aba correta e mostra a mensagem.
- A landing podia renderizar a navegação interna para corretores autenticados. A rota pública agora fica fora do layout interno.
- A busca livre podia interpretar o trecho “até” de IPTU ou condomínio como limite de preço de venda. O parser trata esses encargos antes do preço.
- A listagem anterior podia exibir resultados fora de ordem após requisições concorrentes. O painel passou a cancelar a consulta substituída e a usar o ID como critério de desempate no backend.
- Uma nova tentativa de salvar depois da criação e de uma falha conhecida no upload podia gerar outro imóvel. A tentativa seguinte na mesma tela reutiliza o ID do cadastro.

## Capturas em 390 × 844

[Painel](screenshots/react-mobile/01-dashboard.png) · [Filtros](screenshots/react-mobile/02-filtros.png) · [Compartilhamento](screenshots/react-mobile/03-compartilhar.png) · [Edição](screenshots/react-mobile/04-edicao.png) · [Página pública](screenshots/react-mobile/05-pagina-publica.png)

As capturas usam registros fictícios e fotos de demonstração. [Foto externa](https://images.unsplash.com/photo-1600596542815-ffad4c1539a9) · [Foto interna](https://images.unsplash.com/photo-1600607687939-ce8a6c25118c)

## Resultados

| Verificação | Resultado |
| --- | --- |
| `npm ci`, `npm run typecheck`, `npm run lint` e `npm run build` | Passaram em checkout limpo |
| `php artisan test` | 2 testes passaram |
| Playwright 360 × 800 | 10 testes passaram |
| Playwright 375 × 812 | 10 testes passaram |
| Playwright 390 × 844 | 10 testes passaram |
| Playwright 430 × 932 | 10 testes passaram |
| Playwright 768 × 1024 | 10 testes passaram |
| Playwright 1366 × 768 | 10 testes passaram |

Os 60 testes Playwright cobriram login, sessão e saída, busca e cancelamento, filtros e limpeza, paginação e ordenação, detalhes e Open Graph, cadastro e edição com foto, publicação, compartilhamento, exclusão confirmada, duplicação e venda, falha de rede, áreas de toque e ausência de rolagem horizontal.

## Limites da verificação

A matriz usa Chromium com as dimensões pedidas e emulação de toque. O teste do Web Share simula a interface de compartilhamento do sistema. A URL do WhatsApp, a cópia, a landing e os metadados foram verificados no navegador, com a prévia dentro do aplicativo WhatsApp e o menu nativo em aparelhos físicos pendentes de validação.

Um upload aceito pelo servidor cuja resposta se perdeu na rede pode exigir conferir a galeria antes de reenviar os arquivos. A API de fotos existente devolve confirmação ao fim da requisição. O formulário utiliza o ID do imóvel que recebeu do servidor para novas tentativas na mesma tela.

O campo provisório “Descrição do Anúncio” do formulário Vue não tinha persistência no esquema nem uso na landing ou nos metadados. A descrição persistida do imóvel continua disponível no formulário e na landing.

As instruções de desenvolvimento e publicação manual estão no [README](../README.md).

## Inventário de arquivos

### Criados

- `docs/entrega-react-mobile.md`
- `docs/screenshots/react-mobile/01-dashboard.png`
- `docs/screenshots/react-mobile/02-filtros.png`
- `docs/screenshots/react-mobile/03-compartilhar.png`
- `docs/screenshots/react-mobile/04-edicao.png`
- `docs/screenshots/react-mobile/05-pagina-publica.png`
- `eslint.config.js`
- `playwright.config.ts`
- `resources/js/app.tsx`
- `resources/js/components/ActiveFilters.tsx`
- `resources/js/components/FilterSheet.tsx`
- `resources/js/components/Layout.tsx`
- `resources/js/components/PropertyActions.tsx`
- `resources/js/components/PropertyCard.tsx`
- `resources/js/components/PropertyDetails.tsx`
- `resources/js/components/SearchBar.tsx`
- `resources/js/components/ShareButton.tsx`
- `resources/js/components/Sheet.tsx`
- `resources/js/components/SortSelect.tsx`
- `resources/js/components/StatusTabs.tsx`
- `resources/js/hooks/useAuth.ts`
- `resources/js/hooks/useProperties.ts`
- `resources/js/hooks/useProperty.ts`
- `resources/js/hooks/usePropertyFilters.ts`
- `resources/js/pages/Dashboard.tsx`
- `resources/js/pages/LandingPage.tsx`
- `resources/js/pages/Login.tsx`
- `resources/js/pages/PropertyForm.tsx`
- `resources/js/pages/PropertyView.tsx`
- `resources/js/services/api.ts`
- `resources/js/services/share.ts`
- `resources/js/types/property.ts`
- `tests/e2e/fixture.php`
- `tests/e2e/mobile.spec.ts`
- `tests/e2e/router.php`
- `tests/e2e/serve.mjs`
- `tsconfig.json`

### Modificados

- `.gitignore`
- `README.md`
- `app/Http/Controllers/Api/PropertyController.php`
- `app/Models/Property.php`
- `docs/backend.md`
- `docs/frontend.md`
- `package-lock.json`
- `package.json`
- `resources/css/app.css`
- `resources/views/app.blade.php`
- `vite.config.js`

### Removidos

- `resources/js/api.js`
- `resources/js/app.js`
- `resources/js/bootstrap.js`
- `resources/js/components/App.vue`
- `resources/js/components/Layout.vue`
- `resources/js/pages/Dashboard.vue`
- `resources/js/pages/LandingPage.vue`
- `resources/js/pages/Login.vue`
- `resources/js/pages/PropertyForm.vue`
- `resources/js/pages/PropertyView.vue`
- `resources/js/router/index.js`
- `resources/js/stores/auth.js`
