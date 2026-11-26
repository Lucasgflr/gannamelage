<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

Route::get('/p/{slug}', function (string $slug) {
    $property = Property::with(['photos' => fn ($photos) =>
        $photos->orderByDesc('is_main')->orderBy('order')->orderBy('id')])
        ->where('slug', $slug)
        ->where('status', '!=', 'draft')
        ->first();

    $cliente = request()->query('cliente');

    $og = [
        'title' => $property ? $property->title : 'Imóvel não encontrado',
        'description' => '',
        'image' => asset('images/og-institucional.jpg'),
        'image_width' => 1200,
        'image_height' => 630,
        'image_type' => 'image/jpeg',
        'image_alt' => 'Gannam & Lage · Imóveis',
        'url' => url('/p/'.rawurlencode($property?->slug ?? $slug)),
    ];

    if ($property) {
        $og['description'] = implode(' | ', array_filter([
            'R$ '.number_format((float) $property->sale_price, 2, ',', '.'),
            Str::limit(Str::squish(strip_tags((string) $property->description)), 150),
            $property->property_type,
            $property->address_city ? $property->address_city . '/' . $property->address_state : null,
            $property->bedrooms ? $property->bedrooms . ' quarto' . ($property->bedrooms > 1 ? 's' : '') : null,
            $property->land_area ? $property->land_area . 'm²' : null,
            $property->built_area ? $property->built_area . 'm² construídos' : null,
        ]));

        $disk = Storage::disk('public');
        foreach ($property->photos as $photo) {
            $path = $disk->path($photo->path);
            $size = is_file($path) ? @getimagesize($path) : false;
            if (!$size || !in_array($size['mime'], ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'], true)) {
                continue;
            }

            $og['image'] = asset('storage/'.implode('/', array_map('rawurlencode', explode('/', $photo->path))));
            $og['image_width'] = $size[0];
            $og['image_height'] = $size[1];
            $og['image_type'] = $size['mime'];
            $og['image_alt'] = 'Foto de '.$property->title;
            break;
        }
    } else {
        $og['description'] = 'Confira este imóvel na Gannam & Lage - Vendas';
    }

    if (is_string($cliente) && $cliente !== '') {
        $og['description'] = 'Olá ' . Str::title($cliente) . '! ' . $og['description'];
    }

    return view('app', compact('og'));
});

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
