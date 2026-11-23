import { isAxiosError } from 'axios';
import { Link, useParams } from 'react-router-dom';
import PropertyDetails from '../components/PropertyDetails';
import { useProperty } from '../hooks/useProperty';

export function PropertyRoute({ isPublic }: { isPublic: boolean }) {
    const { id, slug } = useParams();
    const query = useProperty(isPublic ? slug : id, isPublic);
    if (query.isPending) return <p className="workspace" role="status">Carregando imóvel…</p>;
    if (query.isError) {
        const missing = isAxiosError(query.error) && query.error.response?.status === 404;
        return <div className="workspace stack">
            <p role="alert">{missing ? 'Imóvel não encontrado.' : 'Não foi possível carregar o imóvel.'}</p>
            {!missing && <button className="btn" onClick={() => void query.refetch()}>Tentar novamente</button>}
            {!isPublic && <Link to="/">Voltar</Link>}
        </div>;
    }
    return <PropertyDetails key={query.data.id} property={query.data} isPublic={isPublic} />;
}

export default function PropertyView() {
    return <PropertyRoute isPublic={false} />;
}
