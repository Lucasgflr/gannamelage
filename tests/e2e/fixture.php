<?php

use App\Models\Property;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (! $app->environment('testing') || config('database.default') !== 'sqlite'
    || ! str_starts_with(basename(dirname(config('database.connections.sqlite.database'))), 'gannam-e2e-')) {
    throw new RuntimeException('Use o banco temporário do Playwright.');
}

$user = User::create([
    'name' => 'Corretora de teste',
    'email' => 'corretora@example.test',
    'password' => Hash::make('teste-local-2026'),
]);

User::create([
    'name' => 'Outro corretor de teste',
    'email' => 'outro-corretor@example.test',
    'password' => Hash::make('teste-local-2026'),
]);

$prices = [610000, 780000, 480000, 925000, 610000, 520000, 765000];
foreach ($prices as $index => $price) {
    $property = Property::create([
        'user_id' => $user->id,
        'title' => 'Casa Jardim '.$index,
        'description' => 'Casa com ambientes integrados e jardim.',
        'slug' => 'casa-jardim-'.$index,
        'status' => 'available',
        'property_type' => 'casa',
        'sale_price' => $price,
        'address_city' => 'Belo Horizonte',
        'address_neighborhood' => 'Santa Lúcia',
        'address_state' => 'MG',
        'bedrooms' => $index === 2 ? 1 : 3,
        'bathrooms' => 2,
        'garage_spots' => 2,
        'suites' => 1,
        'built_area' => 140,
        'land_area' => 240,
        'iptu' => $index === 3 ? 2000 : 750,
    ]);
    $path = 'properties/'.$property->id.'/capa.jpg';
    $imagePath = getenv('E2E_PHOTO_'.($index % 2 + 1));
    if ($imagePath && is_file($imagePath)) {
        Storage::disk('public')->put($path, file_get_contents($imagePath));
    } else {
        $image = imagecreatetruecolor(480, 260);
        imagefill($image, 0, 0, imagecolorallocate($image, 182, 198, 189));
        ob_start();
        imagejpeg($image);
        Storage::disk('public')->put($path, ob_get_clean());
        imagedestroy($image);
    }
    $property->photos()->create(['path' => $path, 'order' => 0, 'is_main' => true]);
}
