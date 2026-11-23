import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Property } from '../types/property';

export function useProperty(id?: string, isPublic = false) {
    return useQuery({
        queryKey: [isPublic ? 'public-property' : 'property', id],
        enabled: Boolean(id),
        queryFn: async ({ signal }) => {
            const path = isPublic ? '/api/public/properties/' : '/api/properties/';
            const { data } = await api.get<Property>(path + encodeURIComponent(id!), { signal });
            return data;
        },
    });
}
