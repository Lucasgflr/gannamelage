import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export const mainFilters = {
    property_type: 'Tipo',
    address_state: 'Estado',
    address_city: 'Cidade',
    address_neighborhood: 'Bairro',
    min_price: 'Preço mínimo',
    max_price: 'Preço máximo',
    bedrooms: 'Quartos mínimos',
};

export const advancedFilters = {
    suites: 'Suítes mínimas', bathrooms: 'Banheiros mínimos', garage_spots: 'Vagas mínimas',
    min_built_area: 'Área construída mínima (m²)', max_built_area: 'Área construída máxima (m²)',
    min_land_area: 'Área do terreno mínima (m²)', max_land_area: 'Área do terreno máxima (m²)',
    min_condo_price: 'Condomínio mínimo', max_condo_price: 'Condomínio máximo',
    min_iptu: 'IPTU mínimo', max_iptu: 'IPTU máximo',
};

export const filterLabels = { search: 'Busca', status: 'Status', visit: 'Visitas', ...mainFilters, ...advancedFilters };
export type Filter = keyof typeof filterLabels;
type Parameter = Filter | 'page' | 'sort' | 'per_page';

export function usePropertyFilters() {
    const [url, setUrl] = useSearchParams();
    const keys = [...Object.keys(filterLabels), 'sort', 'page', 'per_page'];
    const params = Object.fromEntries(keys.flatMap(key => {
        const value = url.get(key);
        return value ? [[key, value]] : [];
    }));

    const update = useCallback((values: Partial<Record<Parameter, string>>, replace = false) => {
        setUrl(previous => {
            const next = new URLSearchParams(previous);
            if (!Object.hasOwn(values, 'page')) next.delete('page');
            for (const [key, value] of Object.entries(values)) {
                if (value) next.set(key, value);
                else next.delete(key);
            }
            return next;
        }, { replace, preventScrollReset: true });
    }, [setUrl]);

    const clear = () => update(Object.fromEntries(Object.keys(filterLabels).map(key => [key, ''])));

    return { params, update, clear, searching: url.has('buscar') };
}
