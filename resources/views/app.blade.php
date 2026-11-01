{{--
    Página única que o Laravel entrega ao navegador.

    O sistema não tem uma view Blade por tela. Esta página só monta o HTML
    inicial: título, dados de compartilhamento (Open Graph) e a div #app.
    Quem desenha login, painel, formulário e landing é o Vue, montado
    dentro de #app pelo arquivo resources/js/app.js.

    A variável $og só existe na rota /p/{slug} (routes/web.php). Ela traz
    título, descrição, imagem e URL do imóvel para o WhatsApp e outras
    redes mostrarem um cartão de prévia antes mesmo do JavaScript carregar.
    Nas outras rotas, $og não vem e os textos caem no nome do sistema.

    @vite inclui o CSS e o JavaScript compilados (ou o servidor de
    desenvolvimento, quando se usa npm run dev).
--}}
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    {{-- Título da aba. Na landing pública usa o título do imóvel. --}}
    <title>{{ $og['title'] ?? config('app.name') }}</title>

    {{-- Metadados lidos por WhatsApp, Facebook e similares ao colar o link. --}}

    <meta property="og:type" content="website">
    <meta property="og:title" content="{{ $og['title'] ?? config('app.name') }}">
    <meta property="og:description" content="{{ $og['description'] ?? 'Gannam & Lage - Vendas de Imóveis' }}">
    <meta property="og:url" content="{{ $og['url'] ?? url('/') }}">
    {{-- A imagem só entra se o imóvel tiver foto. Sem isso, a rede mostra o link sem capa. --}}
    @if(!empty($og['image']))
    <meta property="og:image" content="{{ $og['image'] }}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    @endif

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="antialiased">
    {{-- Ponto onde o Vue assume a tela. O id "app" é o mesmo usado em app.js (app.mount). --}}
    <div id="app"></div>
</body>
</html>
