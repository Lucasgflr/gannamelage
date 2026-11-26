<?php

namespace App\Support;

use App\Models\Property;
use Illuminate\Support\Collection;

final class PropertyLocations
{
    public static function rows(): Collection
    {
        return Property::query()->select('address_state', 'address_city', 'address_neighborhood')
            ->distinct()->orderBy('address_city')->orderBy('address_neighborhood')->get();
    }

    public static function clean(?string $value): string
    {
        return trim(preg_replace('/\s+/u', ' ', $value ?? ''));
    }

    public static function key(?string $value): string
    {
        return mb_strtolower(self::clean($value));
    }

    public static function states(): array
    {
        return self::rows()->filter(fn ($row) => self::clean($row->address_state) !== '')
            ->groupBy(fn ($row) => strtoupper(self::clean($row->address_state)))
            ->sortKeys()->map(fn ($rows, $uf) => ['uf' => $uf, 'cities' => self::options($rows, true)])
            ->values()->all();
    }

    public static function matchKey(?string $value): string
    {
        return self::key(\Illuminate\Support\Str::ascii(self::clean($value), 'pt'));
    }

    public static function canonicalNeighborhood(array $data, ?Property $property = null): array
    {
        if (!isset($data['address_neighborhood'])) {
            return $data;
        }

        $state = array_key_exists('address_state', $data) ? $data['address_state'] : $property?->address_state;
        $city = array_key_exists('address_city', $data) ? $data['address_city'] : $property?->address_city;
        $name = self::clean($data['address_neighborhood']);
        $existing = self::rows()->first(fn ($row) =>
            self::key($row->address_state) === self::key($state)
            && self::matchKey($row->address_city) === self::matchKey($city)
            && self::matchKey($row->address_neighborhood) === self::matchKey($name));
        $data['address_neighborhood'] = $existing ? self::clean($existing->address_neighborhood) : $name;

        return $data;
    }

    public static function options(?Collection $rows = null, bool $foldAccents = false): array
    {
        $cities = [];
        $keyOf = $foldAccents ? self::matchKey(...) : self::key(...);
        foreach (($rows ?? self::rows()) as $row) {
            $city = self::clean($row->address_city);
            $neighborhood = self::clean($row->address_neighborhood);
            if ($city === '') {
                continue;
            }
            $key = $keyOf($city);
            $cities[$key] ??= ['name' => $city, 'neighborhoods' => []];
            if ($neighborhood !== '') {
                $cities[$key]['neighborhoods'][$keyOf($neighborhood)] ??= $neighborhood;
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
