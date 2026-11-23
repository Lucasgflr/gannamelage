<?php

namespace App\Support;

use App\Models\Property;
use Illuminate\Support\Collection;

final class PropertyLocations
{
    public static function rows(): Collection
    {
        return Property::query()->select('address_city', 'address_neighborhood')
            ->whereNotNull('address_city')->distinct()->orderBy('address_city')->orderBy('address_neighborhood')->get();
    }

    public static function clean(?string $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', $value ?? ''));
    }

    public static function key(?string $value): string
    {
        return mb_strtolower(self::clean($value));
    }

    public static function options(): array
    {
        $cities = [];
        foreach (self::rows() as $row) {
            $city = self::clean($row->address_city);
            $neighborhood = self::clean($row->address_neighborhood);
            if ($city === '') {
                continue;
            }
            $key = self::key($city);
            $cities[$key] ??= ['name' => $city, 'neighborhoods' => []];
            if ($neighborhood !== '') {
                $cities[$key]['neighborhoods'][self::key($neighborhood)] ??= $neighborhood;
            }
        }

        $sortKey = fn ($name) => self::key(\Illuminate\Support\Str::ascii($name, 'pt'));
        $cities = collect($cities)->sortBy(fn ($city) => $sortKey($city['name']))->values();

        return $cities->map(function ($city) use ($sortKey) {
            $city['neighborhoods'] = collect($city['neighborhoods'])->sortBy($sortKey)->values()->all();

            return $city;
        })->all();
    }
}
