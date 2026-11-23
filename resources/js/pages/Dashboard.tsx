import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { PropertyPage } from '../types/property';

export default function Dashboard() {
    const query = useQuery({
        queryKey: ['properties'],
        queryFn: async ({ signal }) => (await api.get<PropertyPage>('/api/properties', { signal })).data,
    });

    return <section className="stack">
        <h1>Imóveis</h1>
        {query.isPending && <p role="status">Carregando imóveis…</p>}
        {query.isError && <button className="btn" onClick={() => void query.refetch()}>Tentar novamente</button>}
        {query.data?.data.map(property => <Link key={property.id} to={`/properties/${property.id}/view`}>{property.title}</Link>)}
    </section>;
}
