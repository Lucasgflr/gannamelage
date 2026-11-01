<?php

use Illuminate\Support\Facades\Route;
use App\Models\Property;
use Illuminate\Support\Str;

Route::get('/p/{slug}', function (string $slug) {
    $property = Property::with('photos')
        ->where('slug', $slug)
        ->where('status', '!=', 'draft')
        ->first();

    $cliente = request()->query('cliente');

    $og = [
        'title' => $property ? $property->title : 'Imóvel não encontrado',
        'description' => '',
        'image' => '',
        'url' => request()->fullUrl(),
    ];

    if ($property) {
        $og['description'] = implode(' | ', array_filter([
            $property->property_type,
            $property->address_city ? $property->address_city . '/' . $property->address_state : null,
            $property->bedrooms ? $property->bedrooms . ' quarto' . ($property->bedrooms > 1 ? 's' : '') : null,
            $property->land_area ? $property->land_area . 'm²' : null,
            $property->built_area ? $property->built_area . 'm² construídos' : null,
        ]));

        $mainPhoto = $property->photos->firstWhere('is_main', true) ?? $property->photos->first();
        if ($mainPhoto) {
            $og['image'] = asset('storage/' . $mainPhoto->path);
        }
    } else {
        $og['description'] = 'Confira este imóvel na Gannam & Lage - Vendas';
    }

    if ($cliente) {
        $og['description'] = 'Olá ' . Str::title($cliente) . '! ' . $og['description'];
    }

    return view('app', compact('og'));
});

Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
