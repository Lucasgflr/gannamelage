# Localização, preços e prévias de compartilhamento

Os filtros exibem cidades e bairros cadastrados, com seleção dependente e validação de parâmetros da URL. A pesquisa por cidade procura dentro da lista quando há mais de oito opções. Os campos de preço de venda usam milhares de reais e mostram o valor em reais antes de salvar ou filtrar. A base de dados e os parâmetros publicados usam reais.

No Laravel, o HTML público inclui preço, resumo e a primeira imagem disponível na ordem da foto principal, demais fotos e imagem institucional. A seleção considera a existência e o formato do arquivo. As fotos existentes mantêm sua marca d’água e dimensões reais. Na demo, a prévia geral usa a imagem institucional. O catálogo demo vem dos imóveis fictícios persistidos no navegador.

## Verificação

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado |
| `npm run lint` | Aprovado |
| `npm run build` | Aprovado |
| `npm run build:demo` | Aprovado |
| `npm run test:unit` | 3 testes aprovados |
| `npm run test:demo` | 10 testes aprovados em 390 × 844 e 1366 × 768 |
| `php artisan test` | 4 testes aprovados, 32 asserções |
| `npm run test:e2e` | 60 testes aprovados nas seis resoluções existentes |

Os testes reais usam Laravel com SQLite descartável e arquivos locais. Foram verificados o HTML bruto do anúncio, URLs HTTPS geradas em teste e respostas públicas HTTP das imagens no servidor de teste. A miniatura no aplicativo WhatsApp e o certificado e redirecionamentos da hospedagem de produção ficam para verificação após publicação autorizada. O cache do WhatsApp pode atrasar a atualização da prévia mesmo quando o HTML já aponta para a nova fotografia.

## Capturas mobile em 390 × 844

[Filtros](screenshots/usabilidade/filtros.png) · [Edição](screenshots/usabilidade/edicao.png) · [Compartilhamento](screenshots/usabilidade/compartilhamento.png)

## Inventário

### Criados

- `app/Support/PropertyLocations.php`
- `docs/melhorias-usabilidade.md`
- `docs/screenshots/usabilidade/compartilhamento.png`
- `docs/screenshots/usabilidade/edicao.png`
- `docs/screenshots/usabilidade/filtros.png`
- `public/images/og-institucional.jpg`
- `resources/js/components/LocationFilters.tsx`
- `resources/js/components/PriceThousandsField.tsx`
- `resources/js/hooks/useLocationOptions.ts`
- `resources/js/utils/location.ts`
- `resources/js/utils/price.ts`
- `tests/Feature/PropertyPresentationTest.php`
- `tests/unit/price.test.ts`

### Modificados

- `app/Http/Controllers/Api/PropertyController.php`
- `demo/api.ts`
- `demo/index.html`
- `docs/backend.md`
- `docs/demo-github-pages.md`
- `docs/frontend.md`
- `package.json`
- `resources/js/components/ActiveFilters.tsx`
- `resources/js/components/FilterSheet.tsx`
- `resources/js/pages/Dashboard.tsx`
- `resources/js/pages/PropertyForm.tsx`
- `resources/views/app.blade.php`
- `routes/api.php`
- `routes/web.php`
- `tests/demo/static.spec.ts`
- `tests/e2e/mobile.spec.ts`
- `tests/e2e/router.php`
- `tests/e2e/serve.mjs`
- `tsconfig.json`
- `vite.demo.config.ts`
