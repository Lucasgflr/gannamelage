<?php

namespace Tests\Feature;

use App\Models\Owner;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyVisitTest extends TestCase
{
    use RefreshDatabase;

    private function property(User $broker): Property
    {
        return Property::create([
            'user_id' => $broker->id, 'slug' => 'casa-antiga', 'title' => 'Casa manual', 'property_type' => 'casa',
            'status' => 'available', 'sale_price' => 650500, 'address_street' => 'Rua Privada',
            'address_state' => 'MG', 'address_city' => 'São Lourenço', 'address_neighborhood' => 'São João',
            'owner_id' => Owner::create(['name' => 'Nome Privado', 'phone' => '35900000000'])->id,
        ]);
    }

    public function test_private_data_requires_a_valid_broker_session(): void
    {
        $broker = User::factory()->create();
        $property = $this->property($broker);
        $base = '/api/properties/'.$property->id;
        $this->getJson($base.'/internal')->assertUnauthorized();
        $this->postJson($base.'/reserve')->assertUnauthorized();
        $this->postJson($base.'/release-reservation')->assertUnauthorized();

        $token = $broker->createToken('test')->plainTextToken;
        $this->getJson($base.'/internal', ['Authorization' => 'Bearer '.$token])
            ->assertOk()->assertJsonPath('owner.name', 'Nome Privado')->assertJsonPath('status', 'available');
        $this->travel(1441)->minutes();
        $this->app['auth']->forgetGuards();
        $this->getJson($base.'/internal', ['Authorization' => 'Bearer '.$token])->assertUnauthorized();
        $this->travelBack();

        $this->getJson('/api/public/properties/casa-antiga')->assertOk()
            ->assertJsonMissingPath('owner')->assertJsonMissingPath('address_street')
            ->assertJsonMissingPath('active_reservation')->assertJsonMissingPath('user_id');
        $this->get('/p/casa-antiga')->assertOk()->assertDontSee('Nome Privado')->assertDontSee('Rua Privada');
    }

    public function test_reservation_conflicts_release_and_expiration_at_brasilia_midnight(): void
    {
        $ana = User::factory()->create(['name' => 'Ana']);
        $rafael = User::factory()->create(['name' => 'Rafael']);
        $property = $this->property($ana);
        $base = '/api/properties/'.$property->id;
        $this->travelTo(Carbon::parse('2026-11-26 09:30', 'America/Sao_Paulo'));

        Sanctum::actingAs($ana);
        $id = $this->postJson($base.'/reserve', ['user_id' => $rafael->id])->assertCreated()
            ->assertJsonPath('active_reservation.broker', 'Ana')
            ->assertJsonPath('active_reservation.mine', true)
            ->assertJsonPath('active_reservation.expires_at', '2026-11-27T03:00:00.000000Z')
            ->json('active_reservation.id');
        $this->postJson($base.'/reserve')->assertConflict()
            ->assertJsonPath('message', 'Você já possui uma reserva ativa para este imóvel.');
        $this->getJson('/api/properties?visit=mine')->assertOk()->assertJsonPath('total', 1);
        $this->getJson('/api/properties?visit=free')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/public/properties/casa-antiga')->assertOk()
            ->assertJsonPath('status', 'available')->assertJsonMissingPath('active_reservation');

        Sanctum::actingAs($rafael);
        $this->getJson('/api/properties?visit=mine')->assertOk()->assertJsonPath('total', 0);
        $this->getJson('/api/properties?visit=reserved&address_state=MG&property_type=casa')
            ->assertOk()->assertJsonPath('data.0.active_reservation.mine', false);
        $this->postJson($base.'/reserve')->assertConflict()->assertJsonPath('active_reservation.broker', 'Ana');
        $this->postJson($base.'/release-reservation', ['reservation_id' => $id])->assertForbidden();

        $this->travelTo(Carbon::parse('2026-11-27 00:00', 'America/Sao_Paulo'));
        $this->getJson($base.'/internal')->assertOk()->assertJsonPath('active_reservation', null);
        $secondId = $this->postJson($base.'/reserve')->assertCreated()->json('active_reservation.id');
        $this->postJson($base.'/release-reservation', ['reservation_id' => $id])->assertConflict();
        $this->postJson($base.'/release-reservation', ['reservation_id' => $secondId])->assertOk();
        $this->assertDatabaseHas('property_reservations', ['id' => $secondId, 'released_by' => $rafael->id, 'release_reason' => 'manual']);

        $thirdId = $this->postJson($base.'/reserve')->assertCreated()->json('active_reservation.id');
        $this->postJson($base.'/sell')->assertOk()->assertJsonPath('status', 'sold');
        $this->postJson($base.'/reserve')->assertConflict();
        $this->getJson($base.'/internal')->assertOk()->assertJsonPath('active_reservation', null);
        $this->assertDatabaseHas('property_reservations', ['id' => $thirdId, 'release_reason' => 'commercial_status']);
        $this->assertDatabaseCount('property_reservations', 3);
    }

    public function test_only_commercially_available_properties_can_be_reserved(): void
    {
        $broker = User::factory()->create();
        $property = $this->property($broker);
        Sanctum::actingAs($broker);
        foreach (['draft', 'reserved', 'sold'] as $status) {
            $property->update(['status' => $status]);
            $this->postJson('/api/properties/'.$property->id.'/reserve')->assertConflict()
                ->assertJsonPath('message', 'Este imóvel não está disponível para visitas.');
        }
        $this->assertDatabaseCount('property_reservations', 0);
    }

    public function test_location_options_and_title_updates_preserve_existing_slug(): void
    {
        $broker = User::factory()->create();
        $property = $this->property($broker);
        Sanctum::actingAs($broker);
        $base = '/api/properties/'.$property->id;
        $this->getJson('/api/properties/filter-options')->assertOk()->assertJsonPath('states.0.uf', 'MG')
            ->assertJsonPath('states.0.cities.0.neighborhoods.0', 'São João');
        $this->putJson($base, ['address_neighborhood' => ' SAO    JOAO '])->assertOk()
            ->assertJsonPath('address_neighborhood', 'São João')->assertJsonPath('title', 'Casa manual');
        $this->putJson($base, ['title' => 'Casa em São João', 'title_automatic' => true])->assertOk()
            ->assertJsonPath('title_automatic', true)->assertJsonPath('slug', 'casa-antiga');
        $this->getJson('/api/public/properties/casa-antiga')->assertOk()
            ->assertJsonPath('title', 'Casa em São João')->assertJsonMissingPath('title_automatic');
    }
}
