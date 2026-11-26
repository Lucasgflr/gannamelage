<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class PropertyReservation extends Model
{
    protected $fillable = [
        'property_slug', 'user_id', 'broker_name', 'reserved_at', 'expires_at',
        'released_at', 'released_by', 'release_reason',
    ];

    protected $casts = [
        'reserved_at' => 'datetime',
        'expires_at' => 'datetime',
        'released_at' => 'datetime',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('released_at')->where('expires_at', '>', now('UTC'));
    }

    public function forBroker(User $user): array
    {
        return [
            'id' => $this->id,
            'broker' => $this->broker_name,
            'reserved_at' => Carbon::parse($this->getRawOriginal('reserved_at'), 'UTC')->toISOString(),
            'expires_at' => Carbon::parse($this->getRawOriginal('expires_at'), 'UTC')->toISOString(),
            'mine' => (int) $this->user_id === (int) $user->id,
        ];
    }
}
