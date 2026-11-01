# Backend — Gannam & Lage Vendas

Documentação do servidor deste sistema, escrita para quem faz manutenção sem precisar ler o código linha a linha. O backend é a parte em PHP. Ele guarda os dados, confere o login e responde às telas.

As bibliotecas de terceiros (pasta `vendor`) não fazem parte desta documentação. Elas vêm prontas com o Laravel.

## O que este backend faz

É um sistema interno de imóveis da imobiliária. A equipe entra com e-mail e senha, cadastra imóveis, anexa fotos e gera um link público para mandar ao cliente. O cliente abre o link sem login.

O servidor não desenha as telas. Ele devolve dados em JSON para o Vue e, numa única página HTML (`resources/views/app.blade.php`), entrega o arquivo que sobe a aplicação no navegador.

Tecnologias usadas de verdade neste projeto:

- **Laravel** — organiza rotas, acesso ao banco e login.
- **Eloquent** — cada tabela importante tem uma classe em `app/Models`.
- **Laravel Sanctum** — gera o token de acesso da API.
- **GD** — extensão do PHP que desenha a marca d'água nas fotos. Não é um pacote instalado à parte.

## Como um pedido percorre o sistema

1. O navegador chama um endereço, por exemplo `POST /api/properties`.
2. O Laravel olha `routes/api.php` ou `routes/web.php` e escolhe o destino.
3. Se a rota estiver no grupo `auth:sanctum`, o token enviado no cabeçalho `Authorization: Bearer ...` é conferido. Sem token válido, a resposta é 401 e a tela manda a pessoa para o login.
4. O controller valida os campos, grava ou lê pelo model e responde JSON.
5. As fotos não ficam dentro do banco. O banco guarda o caminho. O arquivo fica em `storage/app/public/properties/{id-do-imovel}/` e é acessado pelo navegador em `/storage/...`, desde que o link `public/storage` exista (`php artisan storage:link`).

O prefixo `/api` nas rotas de `routes/api.php` é colocado pelo Laravel. No arquivo a rota está escrita como `/login`; no navegador ela é `/api/login`.

`bootstrap/app.php` liga os três arquivos de rota (`web`, `api` e `console`) e ativa `statefulApi()` do Sanctum. Isso permite o cookie de CSRF usado no login e, ao mesmo tempo, o token Bearer usado nas demais chamadas.

## Situação do imóvel

A coluna `properties.status` só aceita quatro valores:

| Valor | Significado | Aparece na página pública? |
| --- | --- | --- |
| `draft` | Rascunho, acabou de ser cadastrado ou foi duplicado | Não |
| `available` | Publicado, à venda | Sim |
| `reserved` | Reservado | Sim |
| `sold` | Vendido (baixa) | Sim |

A página pública esconde apenas o rascunho. Vender não tira o imóvel do link: só muda a situação.

## Banco de dados

As migrations em `database/migrations` criam e alteram as tabelas. Rodar `php artisan migrate` aplica o que ainda não foi aplicado.

### `users`

Quem entra no sistema. Não é o dono do imóvel.

Campos principais: `name`, `email` (único), `password` (hash, nunca texto puro), `email_verified_at`, `remember_token`.

Arquivo: `database/migrations/0001_01_01_000000_create_users_table.php`. A mesma migration cria `password_reset_tokens` e `sessions`, tabelas padrão do Laravel. O login atual usa token, não a tabela `sessions`.

### `owners`

Proprietário do imóvel: a pessoa que está vendendo. Não faz login.

Campos: `name`, `phone` (opcional), `email` (opcional).

Arquivo: `database/migrations/2025_05_06_190000_create_owners_table.php`.

### `properties`

O imóvel. É a tabela central.

Campos de negócio: título, descrição, tipo, área do terreno, área construída, preço de venda, condomínio, IPTU, quartos, suítes, banheiros, vagas, status e slug.

Endereço: rua, número, complemento, bairro, cidade, UF (2 letras) e CEP. Uma migration posterior tornou rua, bairro, cidade, UF e CEP opcionais, porque o formulário permite salvar sem endereço.

Ligações:

- `owner_id` — pode ser nulo. Se o proprietário for apagado, o imóvel permanece (`nullOnDelete`).
- `user_id` — quem cadastrou. Se esse usuário for apagado, os imóveis dele também são (`cascadeOnDelete`).

`slug` é único. É o pedaço da URL pública `/p/{slug}`.

Arquivos:

- `database/migrations/2025_05_06_190001_create_properties_table.php` — cria a tabela.
- `database/migrations/2026_05_07_123618_make_address_fields_nullable_in_properties_table.php` — endereço deixa de ser obrigatório.
- `database/migrations/2026_05_07_133019_add_iptu_to_properties_table.php` — acrescenta `iptu`.

### `property_photos`

Uma linha por foto.

Campos: `property_id`, `path` (caminho relativo no disco), `is_main` (capa), `order`.

Se o imóvel é apagado, as linhas de foto são apagadas junto. Os arquivos no disco são apagados pelo controller, não pelo banco.

Arquivo: `database/migrations/2025_05_06_190002_create_property_photos_table.php`.

### Tabelas de apoio do Laravel

`cache`, `jobs` e `personal_access_tokens` vêm com o framework. A última guarda os tokens do Sanctum. Cada login cria uma linha. O logout apaga o token da requisição atual.

## Arquivos do backend

### `app/Http/Controllers/Controller.php`

Classe pai, vazia de propósito. `AuthController` e `PropertyController` herdam dela para usar o comportamento padrão do Laravel. Ninguém chama esta classe direto (`abstract`).

Foi mantida porque é o ponto comum de todo controller do projeto. Se no futuro existir uma regra compartilhada (por exemplo, um formato único de erro), é aqui que ela entra.

### `app/Http/Controllers/Api/AuthController.php`

Login da equipe. Existe porque as telas não usam formulário clássico do Laravel: elas pedem um token e o reenviam em cada chamada.

- `login` — exige e-mail e senha. Procura o usuário e compara a senha com `Hash::check`. Se falhar, a mensagem é genérica (“credenciais incorretas”), sem dizer se o e-mail existe. Se passar, cria um token de nome `api` e devolve token mais dados do usuário. A senha não sai na resposta.
- `logout` — apaga somente o token usado naquela requisição. Outros tokens do mesmo usuário continuam válidos.
- `user` — devolve quem está logado. A tela chama isso ao abrir, para mostrar o nome. Token inválido gera 401.

### `app/Http/Controllers/Api/PropertyController.php`

Toda a vida do imóvel. Existe para ser a API consumida pelo Vue.

- `index` — lista paginada, sempre com proprietário e fotos. Aceita filtros separados (status, tipo, preço, condomínio, IPTU, cômodos, áreas, cidade, bairro) e um texto livre em `search`. O texto é lido em etapas: tipo, faixa ou limite de preço, IPTU, condomínio, cômodos. O que sobra é procurado em título, descrição, endereço e nome do dono. `per_page` só aceita 5, 10, 15, 20, 25, 30, 50 ou 100; outro valor vira 25. Ordem: mais recente primeiro.
- `store` — cria o imóvel. Título, tipo e preço de venda são obrigatórios. Se vier nome de proprietário, cria um `Owner` e associa. Gera o slug com o título mais um código único. Grava `user_id` de quem está logado. Resposta 201.
- `show` — um imóvel pelo id, com dono e fotos. Usado na ficha interna e na edição. Exige login.
- `update` — altera só o que foi enviado. É assim que “Publicar” funciona: manda apenas `status: available`. Se já existe proprietário, atualiza o mesmo registro; se não existe e veio um nome, cria.
- `destroy` — apaga os arquivos de foto e depois o imóvel. O proprietário em `owners` permanece.
- `duplicate` — cópia do imóvel, do proprietário e dos arquivos. A cópia nasce como `draft`, com slug novo, e o `user_id` passa a ser quem duplicou.
- `uploadPhotos` — recebe `photos[]` (até 10 MB por arquivo), grava em `properties/{id}/` e chama a marca d'água. Se `is_main` for verdadeiro, a primeira do lote vira capa e as capas antigas são desmarcadas. Há um `Log::info` no início para diagnosticar upload que chega vazio.
- `deletePhoto` — apaga arquivo e linha. Se a foto não for daquele imóvel, responde 403.
- `applyWatermark` — desenha, no canto inferior direito, um bloco com um ícone de prédio e o texto `GANNAM & LAGE - VENDAS`. Aceita JPEG, PNG, WEBP e AVIF (AVIF só se o GD desta máquina tiver a função). Procura uma fonte `.ttf` no Windows, no Linux ou em `storage/fonts`. Sem fonte, usa a letra embutida do GD. Grava por cima do mesmo arquivo. É público porque o comando de console chama este método direto.
- `reprocessWatermarks` — repassa todas as fotos por `applyWatermark`. Rodar de novo desenha a marca outra vez por cima da anterior.
- `sell` — muda o status para `sold`. Não apaga o imóvel.
- `showPublic` — busca pelo slug, sem login e sem o proprietário. Rascunho responde 404. Foi separado de `show` para o link do cliente não exigir senha e não levar telefone do dono.
- `parseMoney` — uso interno da busca. `400k`, `400mil` e `400m` viram 400000. Não tem rota.

### `app/Models/User.php`

Linha da tabela `users`. Foi criado pelo Laravel e adaptado com `HasApiTokens` para o Sanctum poder emitir token.

`fillable`: nome, e-mail, senha. A senha é hasheada sozinha pelo cast `password => hashed`. `hidden` tira senha e `remember_token` de qualquer JSON.

Não há relação `properties()` neste model, embora `properties.user_id` aponte para cá. Para achar os imóveis de um usuário, a consulta parte de `Property`.

### `app/Models/Owner.php`

Linha da tabela `owners`. Existe para não misturar “quem vende o imóvel” com “quem entra no sistema”.

`properties()` lista os imóveis daquele dono. Na prática o cadastro cria um owner novo por imóvel quando o nome vem preenchido, em vez de procurar um dono já existente com o mesmo telefone.

### `app/Models/Property.php`

Linha da tabela `properties`. Centraliza as relações e dois atalhos de consulta.

- `owner()` — dono, opcional.
- `photos()` — fotos.
- `user()` — quem cadastrou.
- `mainPhoto()` — a foto com `is_main`. Se não houver, devolve vazio; as telas nesse caso usam a primeira foto.
- `scopeAvailable` — só status `available`. A listagem de hoje usa `byStatus`.
- `scopeByStatus` — filtra um status. O `index` chama isso quando a tela manda `?status=`.

Ponto de manutenção: a coluna `iptu` existe no banco e o controller valida o campo, mas `iptu` não está em `$fillable` nem em `$casts`. O Laravel ignora o valor na gravação em massa. O IPTU digitado no formulário não é salvo até que `iptu` entre nessas duas listas.

### `app/Models/PropertyPhoto.php`

Linha da tabela `property_photos`. Guarda caminho, capa e ordem. `property()` volta ao imóvel. `is_main` sai como verdadeiro ou falso, não como 0 ou 1.

### `app/Console/Commands/ReprocessWatermarks.php`

Comando `php artisan watermark:reprocess`. Existe para recolocar a marca nas fotos antigas sem subir a API e sem login. Faz o mesmo laço de `reprocessWatermarks`, escrevendo o andamento no terminal. Não está agendado: só roda quando alguém executa o comando.

### `app/Console/Kernel.php`

Carrega os comandos da pasta `app/Console/Commands`. Sem este `load`, o artisan não enxergaria `watermark:reprocess`. Não define tarefa agendada.

### `app/Providers/AppServiceProvider.php`

Arquivo padrão do Laravel para registrar serviços na subida da aplicação. `register` e `boot` estão vazios. Não há regra de negócio aqui.

### `routes/api.php`

Mapa da API. Existe para separar o que é dado (JSON) do que é página (HTML).

Pública:

- `POST /api/login`
- `GET /api/public/properties/{slug}`

Exigem token:

- `POST /api/logout`
- `GET /api/user`
- `GET /api/properties` — listar
- `POST /api/properties` — criar
- `GET /api/properties/{id}` — ver
- `PUT /api/properties/{id}` — atualizar
- `DELETE /api/properties/{id}` — apagar
- `POST /api/properties/{id}/photos`
- `POST /api/properties/{id}/duplicate`
- `DELETE /api/properties/{id}/photos/{photo}`
- `POST /api/properties/{id}/sell`
- `POST /api/reprocess-watermarks`

`Route::apiResource` gera as cinco rotas de listar, criar, ver, atualizar e apagar. As outras foram acrescentadas porque não cabem nesse padrão (foto, duplicar, vender, marca d'água).

### `routes/web.php`

Páginas HTML. Existe porque o WhatsApp lê o HTML antes do Vue carregar. Sem esta rota especial, o link compartilhado sairia sem título e sem foto.

- `GET /p/{slug}` — busca o imóvel que não seja rascunho, monta título, descrição e imagem (`$og`) e devolve `app.blade.php`. Se a URL tiver `?cliente=maria`, a descrição começa com “Olá Maria!”.
- `GET /{qualquer-coisa}` — também devolve `app.blade.php`, sem `$og`. O Vue decide qual tela mostrar.

### `routes/console.php`

Traz o comando de exemplo `inspire` do Laravel. Não participa dos imóveis. O comando útil está em `app/Console/Commands`.

### `resources/views/app.blade.php`

Única view usada. Entrega o HTML inicial, as meta tags de compartilhamento e a `div#app`, onde o Vue entra. Comentada no próprio arquivo.

### `resources/views/welcome.blade.php`

Página de exemplo que vem com o Laravel. Nenhuma rota deste sistema a chama. Pode ser ignorada na manutenção.

### `bootstrap/app.php`

Arquivo de arranque do Laravel 11. Aponta as rotas e liga o Sanctum no modo que aceita cookie e token. Não contém regra de imóvel.

## Marca d'água, em sequência

1. A tela envia a foto para `POST /api/properties/{id}/photos`.
2. O arquivo é salvo em `storage/app/public/properties/{id}/`.
3. `applyWatermark` abre a imagem, desenha o bloco e salva no mesmo caminho.
4. A linha em `property_photos` aponta para esse arquivo já marcado.
5. Para fotos que entraram antes da marca existir, roda-se `php artisan watermark:reprocess` ou `POST /api/reprocess-watermarks`.

## Pontos que o técnico precisa conhecer

- O IPTU é pedido na tela e validado no controller, mas o model `Property` não libera o campo `iptu` para gravação. O valor não persiste.
- Duplicar copia também o proprietário para uma linha nova em `owners`. Apagar o imóvel não apaga o dono. Com o tempo a tabela `owners` acumula registros sem imóvel.
- `showPublic` não devolve o proprietário. A ficha interna (`show`) devolve. Não misturar as duas rotas.
- Reprocessar a marca d'água desenha de novo em cima da marca antiga. Não remove a anterior antes.
- O log de upload em `uploadPhotos` grava caminho temporário e tamanho. É diagnóstico, não faz parte da resposta ao navegador.
