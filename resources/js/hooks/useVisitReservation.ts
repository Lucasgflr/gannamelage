import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Status, VisitReservation } from '../types/property';

export const visitFilters = { free: 'Livres para visita', reserved: 'Reservados', mine: 'Minhas reservas' };

export function visitStatus(status: Status, reservation?: VisitReservation | null) {
    if (status !== 'available') return 'Indisponível para visita';
    if (reservation) return reservation.mine ? 'Reservado por você' : `Reservado por ${reservation.broker}`;
    return 'Livre para visita';
}

export function useVisitReservation(id: number) {
    const client = useQueryClient();
    return useMutation({
        mutationFn: async (reservation?: VisitReservation | null) => {
            const action = reservation ? 'release-reservation' : 'reserve';
            const { data } = await api.post<{ message: string }>(`/api/properties/${id}/${action}`,
                reservation ? { reservation_id: reservation.id } : undefined);
            return data.message;
        },
        onSettled: async () => {
            await Promise.all([
                client.invalidateQueries({ queryKey: ['properties'] }),
                client.invalidateQueries({ queryKey: ['property-internal', id] }),
            ]);
        },
    });
}
