# Frontend

O Laravel entrega `resources/views/app.blade.php` e gera os metadados Open Graph de `/p/{slug}`. O Vite carrega `resources/js/app.tsx`, que monta React, React Router e TanStack Query. O Tailwind 4 e os estilos do painel ficam em `resources/css/app.css`.

| Rota | Tela |
| --- | --- |
| `/login` | Entrada da equipe |
| `/` | Painel de imóveis, filtros e paginação |
| `/?buscar=1` | Painel com o foco no campo de busca |
| `/properties/create` | Cadastro de imóvel como rascunho |
| `/properties/:id/edit` | Edição de imóvel, proprietário e fotos |
| `/properties/:id/view` | Ficha interna e galeria |
| `/p/:slug` | Anúncio público sem navegação interna |

## Sessão e dados

- `hooks/useAuth.ts` busca o cookie CSRF, faz login pelo Sanctum e mantém a chave local `token`. Em um 401 autenticado, `services/api.ts` remove o token, o cache da sessão é limpo e o React Router volta ao login.
- `hooks/useProperties.ts` consulta a listagem com o `AbortSignal` do TanStack Query. O dashboard leva a busca para a URL após 350 ms ou ao acionar o botão de busca.
- `hooks/usePropertyFilters.ts` lê e atualiza os parâmetros da URL. Ordenação, troca de filtros e tamanho de página voltam à primeira página. A paginação mantém a busca, os filtros e a ordenação.
- `hooks/useProperty.ts` consulta fichas internas pelo ID e a landing pelo slug. As mutações do painel e do formulário invalidam as consultas relacionadas.
- `PropertyForm.tsx` salva os dados antes de enviar capa e galeria com o endpoint multipart existente. Se o upload falhar depois do cadastro, a tentativa seguinte na mesma tela usa o ID já persistido. As fotos concluídas na mesma tentativa saem da fila.
- `services/share.ts` gera o endereço a partir do slug retornado pela API. O menu deixa WhatsApp e cópia do link disponíveis e oferece Web Share quando o navegador dá suporte. O status de rascunho desabilita o compartilhamento.

## Uso do painel

A aba Buscar move o foco para o campo de texto. Os botões de status ficam ao lado dos filtros. Em Filtros, a seção avançada contém suítes, banheiros, vagas e faixas de áreas, condomínio e IPTU. Os filtros ativos podem ser removidos individualmente ou em conjunto. Alterações no tamanho da página e na ordenação também são registradas na URL.

O cartão leva à ficha interna pela foto e mantém Editar, Compartilhar e Mais opções acessíveis por toque. Em Mais opções, rascunhos podem ser publicados, disponíveis e reservados podem ser vendidos, e os anúncios públicos podem ser abertos pelo link oficial. Duplicar gera outro rascunho. A exclusão de imóvel ou foto exige confirmação. As fichas usam a mesma galeria de fotos e a ficha privada inclui o proprietário.

## Testes de navegador

Após instalar as dependências PHP e npm, use `npm run test:e2e`. A suíte compila os assets, sobe o Laravel localmente e cria um SQLite descartável para cada execução. São seis projetos Chromium com touch em telas até 768 px de largura. Para usar o Chromium do sistema, defina `PLAYWRIGHT_CHROMIUM_PATH`.

Use `E2E_SCREENSHOTS=1 npm run test:e2e -- --project=390x844` para produzir as capturas em `playwright-screenshots/`. Opcionalmente, defina `E2E_PHOTO_1` e `E2E_PHOTO_2` com caminhos para fotos JPEG de demonstração. A suíte gera imagens simples quando esses parâmetros estão ausentes.

## Localização, preços e compartilhamento

Os filtros consultam as cidades cadastradas ao abrir a folha de filtros ou ao carregar uma URL com localização. O bairro depende da cidade selecionada. A remoção de uma cidade também limpa o bairro. Os links continuam usando `address_city` e `address_neighborhood`. A API preserva a pesquisa parcial legada, e os seletores pedem igualdade com `location_exact=1`.

O valor de venda e os limites de preço usam R$ mil na interface. Digite `650,5` para R$ 650.500,00 ou `1,5 milhão` para R$ 1.500.000,00. O ponto separa grupos de milhares e a vírgula marca decimais. O formulário mostra o valor em reais antes de salvar. Payloads e URLs continuam em reais. Condomínio e IPTU também continuam em reais nos campos de entrada.

Os componentes de compartilhamento usam o mesmo link por ambiente. Na aplicação Laravel, o HTML de `/p/:slug` inclui título, preço, resumo e metadados JPEG, PNG ou de outro formato reconhecido para a foto principal disponível. A primeira foto disponível e a imagem institucional são alternativas, nessa ordem. A foto original mantém suas dimensões e marca d’água. Na demonstração, todos os links por hash usam o mesmo HTML com a imagem institucional.

## Localização, títulos e visitas

Cadastro novo começa em Minas Gerais, São Lourenço. O catálogo local foi extraído da [API de municípios do IBGE](https://servicodados.ibge.gov.br/api/v1/localidades/municipios) em 26/11/2026 e fica em `resources/js/utils/municipalities.json`. As cidades cadastradas têm prioridade. O autocomplete de bairro permite gravar um novo nome e reaproveita sugestões da mesma cidade e UF. Os filtros do painel usam as localidades cadastradas.

O título automático usa tipo e bairro em São Lourenço/MG ou tipo e município nas demais localidades. O corretor pode complementar o título ou editá-lo manualmente. Títulos anteriores começam em modo manual e o slug dos anúncios existentes permanece estável.

A mesma URL pública permite entrar como corretor e voltar ao anúncio. A Área do corretor carrega os dados autenticados separadamente. O painel combina filtros de visitas e comerciais e oferece as mesmas ações de reserva no menu do card.
