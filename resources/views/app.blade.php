<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
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

    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>
<body class="antialiased">
    <div id="app"></div>
</body>
</html>
