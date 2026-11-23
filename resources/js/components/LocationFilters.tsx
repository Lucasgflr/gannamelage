import { useId, useState } from 'react';
import type { CityOption } from '../hooks/useLocationOptions';
import { locationKey } from '../utils/location';

export function resolveLocation(cities: CityOption[], city?: string, neighborhood?: string) {
    const selected = cities.find(option => locationKey(option.name) === locationKey(city));
    return {
        city: selected?.name ?? '',
        neighborhood: selected?.neighborhoods.find(name => locationKey(name) === locationKey(neighborhood)) ?? '',
    };
}

export default function LocationFilters({ cities, initialCity, initialNeighborhood }: {
    cities: CityOption[];
    initialCity?: string;
    initialNeighborhood?: string;
}) {
    const [selection, setSelection] = useState(() => resolveLocation(cities, initialCity, initialNeighborhood));
    const [search, setSearch] = useState('');
    const cityId = useId();
    const neighborhoodId = useId();
    const hintId = useId();
    const city = cities.find(option => option.name === selection.city);
    const neighborhoods = city?.neighborhoods ?? [];
    const searchKey = (value: string) => locationKey(value).normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const visible = cities.filter(option => option === city || searchKey(option.name).includes(searchKey(search)));
    const hint = !city ? 'Selecione uma cidade primeiro' : !neighborhoods.length ? 'Nenhum bairro cadastrado nesta cidade.' : '';

    return <div className="field-grid" style={{ gridColumn: '1 / -1' }}>
        {cities.length > 8 && <label style={{ gridColumn: '1 / -1' }}>Pesquisar cidades
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} />
        </label>}
        <label htmlFor={cityId}>Cidade
            <select id={cityId} name="address_city" value={selection.city} onChange={event => {
                setSelection(resolveLocation(cities, event.target.value, selection.neighborhood));
                setSearch('');
            }}>
                <option value="">{cities.length ? 'Todas as cidades' : 'Nenhuma cidade cadastrada'}</option>
                {visible.map(option => <option key={option.name}>{option.name}</option>)}
                {!visible.length && cities.length > 0 && <option disabled>Nenhuma cidade encontrada</option>}
            </select>
        </label>
        <div>
            <label htmlFor={neighborhoodId}>Bairro
                <select id={neighborhoodId} name="address_neighborhood" aria-describedby={hint ? hintId : undefined}
                    disabled={!neighborhoods.length} value={selection.neighborhood}
                    onChange={event => setSelection({ city: selection.city, neighborhood: event.target.value })}>
                    <option value="">Todos os bairros</option>
                    {neighborhoods.map(name => <option key={name}>{name}</option>)}
                </select>
            </label>
            {hint && <small className="muted" id={hintId}>{hint}</small>}
        </div>
    </div>;
}
