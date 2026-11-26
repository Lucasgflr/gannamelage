<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PropertyVisitController extends Controller
{
    public function internal(Request $request, Property $property)
    {
        return response()->json([
            'owner' => $property->owner?->only(['name', 'phone', 'email']),
            'address' => implode(', ', array_filter([
                $property->address_street, $property->address_number, $property->address_complement,
                $property->address_neighborhood, $property->address_city, $property->address_state, $property->address_zip,
            ])),
            'status' => $property->status,
            'active_reservation' => $property->activeReservation?->forBroker($request->user()),
        ])->header('Cache-Control', 'private, no-store');
    }

    public function reserve(Request $request, Property $property)
    {
        return DB::transaction(function () use ($request, $property) {
            $property = Property::lockForUpdate()->findOrFail($property->id);
            $user = $request->user();
            if ($property->status !== 'available') {
                return $this->conflict('Este imóvel não está disponível para visitas.');
            }
            $active = $property->activeReservation;
            if ($active) {
                $reservation = $active->forBroker($user);
                return $this->conflict($reservation['mine']
                    ? 'Você já possui uma reserva ativa para este imóvel.'
                    : "Este imóvel já está reservado pelo corretor {$reservation['broker']} até o final do dia.", $reservation);
            }

            $now = now('America/Sao_Paulo');
            $reservation = $property->reservations()->create([
                'property_slug' => $property->slug,
                'user_id' => $user->id,
                'broker_name' => $user->name,
                'reserved_at' => $now->copy()->utc(),
                'expires_at' => $now->copy()->addDay()->startOfDay()->utc(),
            ]);

            return response()->json([
                'message' => 'Imóvel reservado com sucesso até o final do dia.',
                'active_reservation' => $reservation->forBroker($user),
            ], 201)->header('Cache-Control', 'private, no-store');
        }, 5);
    }

    public function release(Request $request, Property $property)
    {
        return DB::transaction(function () use ($request, $property) {
            $property = Property::lockForUpdate()->findOrFail($property->id);
            $reservation = $property->activeReservation;
            if (!$reservation || (int) $reservation->id !== $request->integer('reservation_id')) {
                return $this->conflict('A reserva mudou. Consulte a disponibilidade atual do imóvel.');
            }
            abort_unless((int) $reservation->user_id === (int) $request->user()->id, 403, 'Somente o corretor responsável pode liberar este imóvel.');
            $property->endVisitReservation($request->user()->id, 'manual');

            return response()->json(['message' => 'Imóvel liberado para visitas.', 'active_reservation' => null])
                ->header('Cache-Control', 'private, no-store');
        }, 5);
    }

    private function conflict(string $message, ?array $reservation = null)
    {
        return response()->json(['message' => $message, 'active_reservation' => $reservation], 409)
            ->header('Cache-Control', 'private, no-store');
    }
}
