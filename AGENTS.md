# AGENTS.md — Diretrizes permanentes para o Codex | Gannam & Lage

> **Aplicação:** repositório `Lucasgflr/gannamelage`, incluindo a branch `feat/react-mobile-first`. Este arquivo deve permanecer na raiz do repositório e ser consultado antes de cada tarefa. Se houver instruções conflitantes, prevalecem a solicitação explícita mais recente do responsável, a segurança dos dados e os contratos existentes. Não tratar este documento como autorização para alterações não solicitadas.

## 1. Missão do produto

O Gannam & Lage Vendas é um sistema imobiliário para corretores e equipe interna gerenciarem imóveis, pesquisarem e filtrarem anúncios, cadastrarem e editarem informações e fotografias, atualizarem status e compartilharem páginas públicas com clientes. O uso predominante é em **celulares**. O objetivo é reduzir passos e erros na operação diária, mantendo estabilidade, legibilidade, segurança e boa experiência em desktop.

**Não transformar o projeto** em marketplace genérico, CRM completo, aplicativo nativo, rede social ou plataforma diferente sem pedido explícito. Não introduzir funcionalidades especulativas nem redesenhar áreas não envolvidas na solicitação.

## 2. Arquitetura e fontes de verdade

- **Aplicação funcional:** frontend React + TypeScript + Vite + Tailwind; backend Laravel 12, API existente, autenticação Sanctum, banco e armazenamento de fotos. Preservar rotas, permissões, dados, endpoints e links públicos `/p/:slug`.
- **Demonstração GitHub Pages:** frontend React compartilhado, compilado com `vite.demo.config.ts` e entrada `demo/index.html`, publicado em `/gannamelage/` na pasta `dist-demo/`; navegação via `HashRouter`. Não executa PHP, banco ou API real.
- **Páginas e lógica de interface compartilhadas:** `resources/js/AppRoutes.tsx`, `resources/js/pages/`, `resources/js/components/`, `resources/js/hooks/` e `resources/js/types/`. As mudanças de interface devem acontecer **primeiro nesses componentes compartilhados**, não em cópias da demo.
- **Adaptação da demo:** `demo/app.tsx`, `demo/api.ts`, `demo/fixtures*`, `demo/share.ts` e `demo/demo.css` são exclusivos do ambiente fictício. O build de demo usa aliases de API/compartilhamento. Preservar essa separação.
- **Aplicação real:** `resources/js/services/api.ts` integra-se ao Laravel; não substituir por mocks. `resources/views/app.blade.php` e `vite.config.js` pertencem à aplicação funcional.
- Antes de mudar um caminho, conferir a árvore **atual** do repositório. Os caminhos listados descrevem a estrutura inspecionada e podem evoluir.

## 3. Regra central: uma funcionalidade, duas execuções

Toda funcionalidade nova ou alterada deve funcionar em **ambos** os contextos, sempre que aplicável:

1. **Demo:** comportamento verificável com dados fictícios e persistência local quando necessário.
2. **Produção/homologação Laravel:** mesma tela e experiência, com dados reais através da API, validação no servidor e autorização.

**Não** desenvolver uma funcionalidade apenas em `demo/` se ela faz parte da interface do produto. **Não** acoplar componentes compartilhados diretamente a `localStorage` de dados fictícios, fixtures, URLs de GitHub Pages ou implementações do Laravel. Manter diferenças em adaptadores de dados, serviços e configurações de entrada.

Quando uma funcionalidade exigir endpoint ainda inexistente, documentar o contrato, implementar o backend compatível quando explicitamente incluído no escopo e criar equivalente fictício no adaptador demo. Se o backend estiver fora do escopo, não simular que a funcionalidade está pronta para produção: registrar a pendência e pedir aprovação antes de ampliar o trabalho.

## 4. Política contra deriva de escopo

Para **cada prompt**, antes de codificar:

1. Identificar o objetivo exato do pedido e os critérios observáveis de sucesso.
2. Listar os arquivos provavelmente envolvidos e os efeitos sobre demo e Laravel.
3. Verificar comportamento existente, testes e contratos antes de alterar.
4. Executar **somente** mudanças necessárias ao pedido, incluindo correções indispensáveis para que ele funcione.
5. Preservar comportamento e identidade visual não mencionados.
6. Evitar refatoração ampla, troca de bibliotecas, reestruturação de pastas, novas dependências e migrações de banco sem justificativa objetiva e aprovação.
7. Se detectar outros problemas, relatá-los em **Pendências sugeridas**; não corrigi-los silenciosamente.
8. Se o pedido for ambíguo e houver risco de afetar dados, produção, contratos ou UX importante, pedir esclarecimento.

**Proibido como iniciativa própria:** substituir Laravel, mudar a hospedagem, remover autenticação, alterar regras comerciais, mudar slugs existentes, expor dados de proprietários, inserir dados reais na demo, reescrever telas sem relação com a tarefa ou criar um segundo frontend independente.

## 5. Padrões de interface e negócio

- Mobile-first (priorizar 360–430 px), sem hover obrigatório, sem rolagem horizontal e com áreas de toque confortáveis (alvo de ~44 px).
- Busca, filtros, cards e compartilhamento devem continuar rápidos e compreensíveis; preservar parâmetros e navegação sempre que possível.
- Preservar estados de carregamento, vazio, erro e sucesso; validar campos e impedir ações duplicadas.
- Ações destrutivas exigem confirmação; status e ações disponíveis devem respeitar regras do backend.
- Manter informações privadas do proprietário restritas à área autenticada; página pública exibe somente dados autorizados.
- Usar TypeScript e componentes existentes; preferir pequenos ajustes reutilizáveis a novas abstrações desnecessárias.
- Não alterar identidade, textos comerciais, paleta ou estrutura de navegação sem pedido específico, exceto para corrigir acessibilidade ou falha comprovada.

## 6. Contratos e diferenças entre demo e real

- **API real é a fonte de verdade** de IDs, slugs, permissões, validações, status e persistência. A demo deve reproduzir os contratos relevantes, não inventar formatos incompatíveis.
- Tipos compartilhados em `resources/js/types/` devem representar a API real; fixtures devem obedecer aos mesmos tipos.
- Mudanças em filtros, ordenação, paginação, edição, fotos, publicação e compartilhamento devem ser testadas em ambos os adaptadores.
- Na demo, usar exclusivamente perfis e imóveis fictícios, identificados como demonstração. Não enviar requisições à API real nem carregar credenciais de produção.
- Persistência local da demo não equivale a persistência real. Se a estrutura de fixtures mudar, planejar migração/versionamento ou limpeza segura dos dados locais de demonstração.
- Preservar `HashRouter` e base `/gannamelage/` na demo; preservar `BrowserRouter` e rotas reais na aplicação Laravel.
- Preservar o fluxo de geração de metadados Open Graph pelo servidor para os anúncios reais; a demo não substitui essa funcionalidade.
- Não modificar `vite.demo.config.ts`, `vite.config.js`, workflows ou scripts de build sem verificar impacto nos dois destinos.

## 7. Processo mínimo por tarefa

### Antes
- Ler este `AGENTS.md`, o `README.md` e a documentação relacionada ao pedido.
- Examinar a implementação atual e registrar um plano curto: objetivo, arquivos, riscos, impacto na demo e impacto na aplicação funcional.
- Identificar se a alteração é **compartilhada**, **exclusiva da demo**, **exclusiva do backend** ou **infraestrutura**.

### Durante
- Fazer alterações pequenas, coerentes e revisáveis.
- Centralizar lógica compartilhável em `resources/js`.
- Usar adaptadores de ambiente para dados e serviços, sem duplicar telas.
- Adicionar ou atualizar testes relevantes à mudança.
- Não modificar a branch `main` nem executar deploy de produção sem autorização explícita.

### Depois
- Executar, quando disponíveis: `npm run typecheck`, `npm run lint`, `npm run build`, `npm run build:demo`, `npm run test:demo` e testes específicos afetados (`php artisan test` e/ou Playwright da aplicação real quando o ambiente permitir).
- Se algum teste não puder ser executado, explicar **qual**, **por quê** e **o risco residual**; não declarar que passou.
- Verificar especialmente navegação mobile, ações por toque, filtros, cards, URLs, compartilhamento e estados de erro quando afetados.
- Conferir que o build demo não importa serviços reais e que o build Laravel não importa fixtures da demo.
- Entregar resumo dos arquivos alterados, comportamento na demo, comportamento na aplicação real, resultados de testes e pendências.

## 8. Critérios de aceite para qualquer alteração funcional

A tarefa só estará pronta quando:

- [ ] Atende exatamente ao pedido, sem funcionalidades extras não autorizadas.
- [ ] Reutiliza os componentes compartilhados sempre que cabível.
- [ ] Funciona na demonstração com dados fictícios, quando aplicável.
- [ ] Funciona ou tem integração claramente implementada e testada com Laravel, quando aplicável.
- [ ] Não rompe login, rotas, busca, filtros, cards, edição, status, fotos ou compartilhamento existentes.
- [ ] Não introduz vazamento de dados, dependência de hover ou quebra mobile.
- [ ] Compila e passa nas verificações pertinentes, ou apresenta limitações verificáveis.
- [ ] Não modifica produção, banco real nem `main` sem aprovação.
- [ ] A entrega descreve explicitamente qualquer diferença remanescente entre demo e real.

## 9. Modelo obrigatório de resposta do Codex

Ao concluir cada prompt, responder objetivamente com:

**Objetivo atendido:** uma frase.

**Arquivos alterados:** caminhos e motivo resumido.

**Compatibilidade:** `Demo: [funciona / não aplicável / pendente]`; `Laravel: [funciona / não aplicável / pendente]`, com explicação de qualquer pendência.

**Testes executados:** comandos e resultados reais.

**Riscos e pendências:** somente os relevantes, sem executar melhorias adicionais por conta própria.

**Próximo passo sugerido:** no máximo uma recomendação ligada diretamente ao objetivo atual.

## 10. Regra para solicitações futuras

Cada novo prompt é uma **alteração incremental do mesmo produto**, não autorização para reinventá-lo. Este arquivo define o escopo persistente. Se um pedido novo contradisser estas regras, apontar o conflito e solicitar decisão antes de implementar, exceto quando o responsável ordenar explicitamente a mudança e suas consequências estiverem claras.

**Princípio final:** preservar o que funciona, alterar apenas o necessário e garantir que o que for validado na demonstração seja reutilizável na aplicação real sem reescrever a interface.
