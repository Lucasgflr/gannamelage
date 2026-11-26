import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { visitStatus } from '../hooks/useVisitReservation';
import { api, errorMessage } from '../services/api';
import { statuses, type InternalProperty } from '../types/property';
import VisitAction from './VisitAction';

const dateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', dateStyle: 'short', timeStyle: 'short',
});

export default function BrokerArea({ id }: { id: number }) {
    const [message, setMessage] = useState('');
    const internal = useQuery({
        queryKey: ['property-internal', id],
        queryFn: async ({ signal }) => (await api.get<InternalProperty>(`/api/properties/${id}/internal`, { signal })).data,
        refetchInterval: 15_000,
    });
    const property = internal.data;
    const reservation = property?.active_reservation;
    const phone = property?.owner?.phone?.replace(/\D/g, '');
    const whatsapp = phone && (phone.length === 10 || phone.length === 11 ? `55${phone}` : phone);

    return <section className="panel stack">
        <h2>Área do corretor</h2>
        {internal.isPending && <p role="status">Carregando informações internas…</p>}
        {internal.isError && <p role="alert">{errorMessage(internal.error, 'Não foi possível carregar os dados internos.')}</p>}
        {property && <>
            {property.owner?.name && <p>Proprietário <strong>{property.owner.name}</strong></p>}
            {property.owner?.phone && <p>Telefone <strong>{property.owner.phone}</strong></p>}
            {whatsapp && <a className="btn" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">WhatsApp do proprietário</a>}
            {property.address && <p>Endereço completo <strong>{property.address}</strong></p>}
            <p>Situação comercial <strong>{statuses[property.status]}</strong></p>
            <p><strong>{visitStatus(property.status, reservation)}</strong></p>
            {reservation && <>
                <p>Corretor responsável <strong>{reservation.broker}</strong></p>
                <p>Reserva feita em {dateTime.format(new Date(reservation.reserved_at))}</p>
                <p>Expira em {dateTime.format(new Date(reservation.expires_at))} (horário de Brasília)</p>
            </>}
            <div className="row wrap">
                <VisitAction id={id} status={property.status} reservation={reservation} notify={setMessage} />
                <Link className="btn" to={`/properties/${id}/edit`}>Editar imóvel</Link>
            </div>
            {message && <p role="status">{message}</p>}
        </>}
    </section>;
}
