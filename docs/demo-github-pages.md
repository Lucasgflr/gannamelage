# Demonstração no GitHub Pages

O ponto de entrada da demonstração é `demo/index.html`. O Vite usa `vite.demo.config.ts` para gerar `dist-demo/index.html` e `dist-demo/assets/`, com base `/gannamelage/`. A demo usa `HashRouter` e compartilha as telas React com o Laravel. Sua camada de dados roda no navegador e a sessão seleciona um perfil fictício sem senha.

## Rodar localmente

```bash
npm ci
npm run build:demo
npm run preview:demo
```

Abra `http://localhost:4173/gannamelage/`. Para desenvolvimento com recarga automática, use `npm run dev:demo`. Para testar o artefato estático com Playwright:

```bash
npx playwright install chromium
npm run test:demo
```

O teste compila e serve a demo com Vite. Ele cobre os fluxos em celular e desktop, verifica links por hash, carregamento de fotos e persistência local, e bloqueia chamadas HTTP à API e requisições externas.

## Publicar

1. No GitHub, abra **Settings → Pages** e selecione **GitHub Actions** em **Build and deployment → Source**. Atualmente essa configuração usa a branch `main`.
2. Confira em **Settings → Environments → github-pages** que a política permite deploy de `feat/react-mobile-first`. Essa branch já consta na política consultada.
3. Faça um novo push em `feat/react-mobile-first`. O workflow `.github/workflows/deploy-pages.yml` instala dependências, verifica tipos e lint, executa o teste que gera `dist-demo/`, envia o artefato e publica a demo quando o Pages estiver configurado para GitHub Actions.
4. Em **Actions**, verifique a conclusão do job `deploy` e acesse a aplicação. [Demonstração](https://lucasgflr.github.io/gannamelage/)

A demo tem configuração e saída próprias. O build Laravel continua com `npm run build`, `vite.config.js` e `public/build/`. A aplicação principal usa `BrowserRouter`, Sanctum e os serviços de produção existentes.

## Limitações

- Os perfis, endereços, contatos e imóveis iniciais são fictícios. Use informações inventadas ao testar formulários. Escolher um perfil demonstra a navegação autenticada, sem validar identidade ou senha.
- A sessão demonstrativa usa `sessionStorage` e as mudanças de imóveis usam `localStorage`. Os dados ficam no navegador e cada perfil usa o mesmo catálogo local. Para restaurar o catálogo, remova apenas a chave `gannamelage-demo:v1:properties` no armazenamento local.
- Selecionar uma foto permite pré-visualizá-la durante a edição. Ao salvar, a demo usa uma foto ilustrativa do pacote. O arquivo local fica fora da persistência, e a marca-d’água exige o backend Laravel.
- A busca local aceita título, descrição, localização, slug e código. Os filtros estruturados, a ordenação e a paginação são simulados. A interpretação de frases avançadas pertence à API Laravel.
- Links por hash de imóveis do catálogo inicial funcionam em outro navegador. Alterações locais e imóveis novos só aparecem no navegador que os gravou. As páginas estáticas usam metadados gerais da demo.
- As fotos são ilustrativas e não representam imóveis cadastrados pela imobiliária. [Exterior](https://images.unsplash.com/photo-1600596542815-ffad4c1539a9) · [Interior](https://images.unsplash.com/photo-1600607687939-ce8a6c25118c)
