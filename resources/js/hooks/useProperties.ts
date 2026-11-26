import { useQuery } from '@tanstack/react-query';
import type { PropertyPage } from '../types/property';
import { api } from '../services/api';

export function useProperties(params: Record<string, string>) {
    return useQuery({
        refetchInterval: 15_000,
        queryKey: ['properties', params],
        queryFn: async ({ signal }) => {
            const { data } = await api.get<PropertyPage>('/api/properties', { params, signal });
            return data;
        },
    });
}
