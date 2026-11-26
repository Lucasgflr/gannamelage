import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface CityOption {
    name: string;
    neighborhoods: string[];
}

export interface StateOption { uf: string; cities: CityOption[] }

export function useLocationOptions(enabled: boolean) {
    return useQuery({
        queryKey: ['properties', 'filter-options'],
        enabled,
        queryFn: async ({ signal }) => {
            const { data } = await api.get<{ cities: CityOption[]; states: StateOption[] }>('/api/properties/filter-options', { signal });
            return data;
        },
    });
}
