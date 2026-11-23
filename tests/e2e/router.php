<?php

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$public = $_SERVER['DOCUMENT_ROOT'];

if (preg_match('~^/(?:build/assets|storage/properties)/[a-zA-Z0-9./_-]+$~', $path)
    && ! str_contains($path, '..') && is_file($public.$path)
    && preg_match('~\.(?:js|css|woff2|png|jpe?g|webp)$~i', $path)) {
    return false;
}

require __DIR__.'/../../public/index.php';
