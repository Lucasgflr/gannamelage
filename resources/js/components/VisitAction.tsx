import { useState } from 'react';
import { useVisitReservation } from '../hooks/useVisitReservation';
import { errorMessage } from '../services/api';
import type { Status, VisitReservation } from '../types/property';

export default function VisitAction({ id, status, reservation, notify }: {
    id: number;
    status: Status;
    reservation?: VisitReservation | null;
    notify: (message: string) => void;
}) {
    const [confirmedAction, setConfirmedAction] = useState<{ reservation?: VisitReservation | null }>();
    const mutation = useVisitReservation(id);
    if (status !== 'available' || (reservation && !reservation.mine)) {
        return mutation.isError
            ? <p role="alert">{errorMessage(mutation.error, 'Não foi possível realizar a reserva. Verifique sua conexão e tente novamente.')}</p>
            : null;
    }
    return <>
        {confirmedAction ? <div className="stack">
            <p>{confirmedAction.reservation ? 'Liberar este imóvel para visitas?' : 'Reservar este imóvel para visitas até o final do dia?'}</p>
            <div className="row wrap">
                <button className="btn primary" disabled={mutation.isPending} onClick={() => {
                    mutation.mutate(confirmedAction.reservation, { onSuccess: notify });
                    setConfirmedAction(undefined);
                }}>Confirmar</button>
                <button className="btn" onClick={() => setConfirmedAction(undefined)}>Cancelar</button>
            </div>
        </div> : <button className="btn" disabled={mutation.isPending}
            onClick={() => { mutation.reset(); setConfirmedAction({ reservation }); }}>{reservation ? 'Liberar imóvel' : 'RESERVAR'}</button>}
        {mutation.isError && <p role="alert">{errorMessage(mutation.error,
            'Não foi possível realizar a reserva. Verifique sua conexão e tente novamente.')}</p>}
    </>;
}
