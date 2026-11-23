<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyPresentationTest extends TestCase
{
    use RefreshDatabase;

    private function property(User $user, string $slug, ?string $city = null, ?string $neighborhood = null): Property
    {
        return Property::create([
            'user_id' => $user->id, 'slug' => $slug, 'title' => 'Casa para teste', 'property_type' => 'casa',
            'status' => 'available', 'sale_price' => '650500.37', 'description' => '<p>Casa com jardim.</p>',
            'address_city' => $city, 'address_neighborhood' => $neighborhood,
        ]);
    }

    public function test_catalog_ignores_empty_locations_and_deduplicates_within_each_city(): void
    {
        $user = User::factory()->create();
        $this->property($user, 'cidade-a', 'São Lourenço', 'Centro');
        $this->property($user, 'cidade-b', ' são   lourenço ', ' CENTRO ');
        $this->property($user, 'cidade-c', 'São Lourenço', 'Federal');
        $this->property($user, 'cidade-d', 'Alfenas', 'Outro');
        $this->property($user, 'cidade-e', 'Nova São Lourenço', 'Centro');
        $this->property($user, 'cidade-nula', null, 'Invisível');
        $this->property($user, 'cidade-vazia', '   ', 'Invisível');
        $this->property($user, 'bairro-nulo', 'Varginha', null);

        $this->getJson('/api/properties/filter-options')->assertUnauthorized();
        Sanctum::actingAs($user);
        $options = $this->getJson('/api/properties/filter-options')->assertOk()->json('cities');
        $this->assertSame(['alfenas', 'nova são lourenço', 'são lourenço', 'varginha'],
            array_map(fn ($city) => mb_strtolower($city['name']), $options));
        $this->assertSame(['centro', 'federal'], array_map('mb_strtolower', $options[2]['neighborhoods']));
        $this->assertSame([], $options[3]['neighborhoods']);

        $params = http_build_query(['address_city' => 'São Lourenço', 'address_neighborhood' => 'Centro', 'location_exact' => '1',
            'min_price' => '650000.00', 'max_price' => '651000.00']);
        $this->getJson('/api/properties?'.$params)->assertOk()->assertJsonPath('total', 2);
        $this->getJson('/api/properties?address_city=Louren')->assertOk()->assertJsonPath('total', 4);
    }

    public function test_html_uses_main_photo_then_first_photo_then_institutional_image(): void
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $property = $this->property($user, 'casa-teste');
        $owner = \App\Models\Owner::create(['name' => 'Dado Privado']);
        $property->owner()->associate($owner)->save();
        $path = 'https://anuncios.example.test/p/casa-teste';

        $this->get($path)->assertOk()->assertSee('https://anuncios.example.test/images/og-institucional.jpg', false)
            ->assertSee('property="og:image:width" content="1200"', false);
        $directory = 'properties/'.$property->id;
        foreach (['primeira.jpg', 'principal.jpg'] as $index => $file) {
            $image = UploadedFile::fake()->image($file, 640, 480);
            Storage::disk('public')->put($directory.'/'.$file, file_get_contents($image->getPathname()));
            $property->photos()->create(['path' => $directory.'/'.$file, 'order' => $index, 'is_main' => $index === 1]);
        }

        $this->get($path.'?cliente=maria')->assertOk()
            ->assertSee('property="og:url" content="'.$path.'"', false)
            ->assertSee('property="og:title" content="Casa para teste"', false)
            ->assertSee('R$ 650.500,37 | Casa com jardim.', false)
            ->assertSee('https://anuncios.example.test/storage/'.$directory.'/principal.jpg', false)
            ->assertSee('property="og:image:width" content="640"', false)
            ->assertSee('property="og:image:height" content="480"', false)
            ->assertSee('property="og:image:type" content="image/jpeg"', false)
            ->assertSee('property="og:image:alt" content="Foto de Casa para teste"', false)
            ->assertDontSee('Dado Privado');

        $property->photos()->update(['is_main' => false]);
        $this->get($path)->assertOk()->assertSee('/storage/'.$directory.'/primeira.jpg', false);

        Sanctum::actingAs($user);
        $upload = $this->postJson('/api/properties/'.$property->id.'/photos', [
            'photos' => [UploadedFile::fake()->image('nova.jpg', 640, 480)], 'is_main' => '1',
        ])->assertCreated()->json('0.path');
        $this->get($path)->assertOk()->assertSee('/storage/'.$upload, false)
            ->assertDontSee('/storage/'.$directory.'/primeira.jpg', false);

        Storage::disk('public')->delete($upload);
        $this->get($path)->assertOk()->assertSee('/storage/'.$directory.'/primeira.jpg', false);
    }
}
