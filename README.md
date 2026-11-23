# Gannam & Lage Vendas

Painel de imóveis em React, TypeScript e Laravel 12. Links de anúncios públicos usam `/p/{slug}`.

## Desenvolvimento local

Instale Node.js 22 ou 24, npm, Composer 2 e PHP 8.4 com as extensões do projeto, incluindo GD para a marca d'água e o driver PDO do banco usado. O lockfile atual traz dependências que exigem PHP 8.4.

Em um checkout novo, configure um banco de desenvolvimento antes de rodar as migrações. O exemplo abaixo usa SQLite local.

```bash
composer install
npm ci
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan storage:link
```

Use `composer run dev` ou rode `php artisan serve` e `npm run dev` em terminais separados. Abra `http://127.0.0.1:8000` com uma conta do banco de desenvolvimento. Em um SQLite descartável, `php artisan db:seed` cria a conta de demonstração `test@example.com` com senha `password`.

## Verificação

```bash
npm run typecheck
npm run lint
npm run build
php artisan test
npx playwright install chromium
npm run test:e2e
```

O Playwright usa o Laravel com um arquivo SQLite e armazenamento de fotos temporários. Os dados, contas e arquivos de produção ficam fora do teste.

## Deploy manual

1. Em staging, compile o commit da entrega com `npm ci` e `npm run build` e instale o backend com `composer install --no-dev --optimize-autoloader`.
2. Publique os arquivos Laravel e o diretório `public/build` da mesma compilação. Sirva `public/` como raiz web e mantenha as regras existentes de encaminhamento para `public/index.php`.
3. Preserve a configuração do ambiente, o banco, o `APP_KEY` e o armazenamento persistente de fotos. Confira se `public/storage` aponta para o armazenamento correto. A entrega usa o esquema existente, incluindo a migração de IPTU que já faz parte do projeto.
4. Em staging, confira o login, a listagem, a edição e uma URL pública existente. Se precisar reverter a entrega, restaure os arquivos da revisão anterior junto com seus assets compilados e mantenha o armazenamento persistente.

[Documentação do frontend](docs/frontend.md) · [Documentação da API](docs/backend.md) · [Relatório da entrega React](docs/entrega-react-mobile.md)
