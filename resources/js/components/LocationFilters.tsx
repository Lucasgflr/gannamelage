import { useId, useState } from 'react';
import type { CityOption, StateOption } from '../hooks/useLocationOptions';
import { locationKey } from '../utils/location';

export function resolveLocation(cities: CityOption[], city?: string, neighborhood?: string) {
    const selected = cities.find(option => locationKey(option.name) === locationKey(city));
    return {
        city: selected?.name ?? '',
        neighborhood: selected?.neighborhoods.find(name => locationKey(name) === locationKey(neighborhood)) ?? '',
    };
}

export default function LocationFilters({ cities, states, initialState, initialCity, initialNeighborhood }: {
    cities: CityOption[];
    states: StateOption[];
    initialState?: string;
    initialCity?: string;
    initialNeighborhood?: string;
}) {
    const [state, setState] = useState(() => states.find(option => option.uf === initialState)?.uf ?? '');
    const availableCities = states.find(option => option.uf === state)?.cities ?? cities;
    const [selection, setSelection] = useState(() => resolveLocation(availableCities, initialCity, initialNeighborhood));
    const [search, setSearch] = useState('');
    const cityId = useId();
    const neighborhoodId = useId();
    const hintId = useId();
    const city = availableCities.find(option => option.name === selection.city);
    const neighborhoods = city?.neighborhoods ?? [];
    const searchKey = (value: string) => locationKey(value).normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const visible = availableCities.filter(option => option === city || searchKey(option.name).includes(searchKey(search)));
    const hint = !city ? 'Selecione uma cidade primeiro' : !neighborhoods.length ? 'Nenhum bairro cadastrado nesta cidade.' : '';

    return <div className="field-grid" style={{ gridColumn: '1 / -1' }}>
        <label>Estado
            <select name="address_state" value={state} onChange={event => {
                setState(event.target.value);
                setSelection({ city: '', neighborhood: '' });
                setSearch('');
            }}>
                <option value="">Todos os estados</option>
                {states.map(option => <option key={option.uf}>{option.uf}</option>)}
            </select>
        </label>
        {availableCities.length > 8 && <label style={{ gridColumn: '1 / -1' }}>Pesquisar cidades
            <input type="search" value={search} onChange={event => setSearch(event.target.value)} />
        </label>}
        <label htmlFor={cityId}>Cidade
            <select id={cityId} name="address_city" value={selection.city} onChange={event => {
                setSelection(resolveLocation(availableCities, event.target.value, selection.neighborhood));
                setSearch('');
            }}>
                <option value="">{availableCities.length ? 'Todas as cidades' : 'Nenhuma cidade cadastrada'}</option>
                {visible.map(option => <option key={option.name}>{option.name}</option>)}
                {!visible.length && availableCities.length > 0 && <option disabled>Nenhuma cidade encontrada</option>}
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
