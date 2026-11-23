import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import type { PropertyPage } from '../types/property';
import PropertyCard from '../components/PropertyCard';
import StatusTabs from '../components/StatusTabs';

export default function Dashboard() {
    const [status, setStatus] = useState('');
    const [message, setMessage] = useState('');
    const query = useQuery({
        queryKey: ['properties', status],
        queryFn: async ({ signal }) => (await api.get<PropertyPage>('/api/properties', { signal, params: { status } })).data,
    });

    return <section className="stack">
        <h1>Imóveis</h1>
        <StatusTabs value={status} change={setStatus} />
        {message && <p role="status">{message}</p>}
        {query.isPending && <p role="status">Carregando imóveis…</p>}
        {query.isError && <button className="btn" onClick={() => void query.refetch()}>Tentar novamente</button>}
        <div className="property-grid">{query.data?.data.map(property =>
            <PropertyCard key={property.id} property={property} notify={setMessage} />)}
        </div>
    </section>;
}
