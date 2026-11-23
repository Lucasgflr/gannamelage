import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePropertyFilters } from '../hooks/usePropertyFilters';
import { useProperties } from '../hooks/useProperties';
import { errorMessage } from '../services/api';
import ActiveFilters from '../components/ActiveFilters';
import FilterSheet from '../components/FilterSheet';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import SortSelect from '../components/SortSelect';
import StatusTabs from '../components/StatusTabs';

export default function Dashboard() {
    const { params, update, clear, searching } = usePropertyFilters();
    const [message, setMessage] = useState('');
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [reset, setReset] = useState(0);
    const results = useRef<HTMLDivElement>(null);
    const query = useProperties(params);
    const page = query.data;
    const search = useCallback((value: string) => {
        update({ search: value }, true);
    }, [update]);

    useEffect(() => {
        if (page && page.current_page > page.last_page) {
            update({ page: String(page.last_page) }, true);
        }
    }, [page, update]);

    function goToPage(number: number) {
        update({ page: String(number) });
        results.current?.scrollIntoView({ block: 'start' });
        results.current?.focus({ preventScroll: true });
    }

    return <section className="stack">
        <header className="dashboard-heading">
            <div><h1>Imóveis</h1><p className="muted">Painel de vendas</p></div>
            <Link className="btn primary desktop-create" to="/properties/create">
                <i className="fa-solid fa-plus" aria-hidden="true" /> Novo imóvel
            </Link>
        </header>
        <div className="panel stack search-panel">
            <div className="search-tools">
                <SearchBar key={reset} search={params.search ?? ''} change={search} focus={searching} />
                <button className="btn" onClick={() => setFiltersOpen(true)} aria-haspopup="dialog">
                    <i className="fa-solid fa-sliders" aria-hidden="true" /> Filtros
                </button>
            </div>
            <StatusTabs value={params.status ?? ''} change={status => update({ status })} />
            <ActiveFilters params={params} remove={key => {
                if (key === 'search') setReset(value => value + 1);
                update({ [key]: '' });
            }} clear={() => {
                setReset(value => value + 1);
                clear();
            }} />
        </div>
        {filtersOpen && <FilterSheet params={params} close={() => setFiltersOpen(false)} apply={update} />}
        {message && <p role="status" className="panel">{message}</p>}
        <div className="row spread wrap results-toolbar" ref={results} tabIndex={-1}>
            <p className="muted" role="status">{query.isPending ? 'Carregando imóveis…' :
                page ? `${page.total.toLocaleString('pt-BR')} ${page.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}` : 'Resultados'}</p>
            <SortSelect sort={params.sort ?? ''} change={sort => update({ sort })} />
        </div>
        {query.isError && <div className="panel stack">
            <p role="alert">{errorMessage(query.error, 'Não foi possível carregar os imóveis. Verifique a conexão.')}</p>
            <button className="btn" onClick={() => void query.refetch()}>Tentar novamente</button>
        </div>}
        {page?.total === 0 && <div className="panel stack"><h2>Nenhum imóvel encontrado</h2><p className="muted">Experimente mudar a busca ou os filtros.</p></div>}
        {page && <div className="property-grid" aria-busy={query.isFetching}>
            {page.data.map(property => <PropertyCard key={property.id} property={property} notify={setMessage} />)}
        </div>}
        {page && page.last_page > 1 && <nav className="pagination" aria-label="Paginação">
            <button className="btn" disabled={page.current_page === 1} onClick={() => goToPage(page.current_page - 1)}>Anterior</button>
            <span>Página {page.current_page} de {page.last_page}</span>
            <button className="btn" disabled={page.current_page >= page.last_page} onClick={() => goToPage(page.current_page + 1)}>Próxima</button>
        </nav>}
        <label className="page-size">Imóveis por página
            <select value={params.per_page ?? '25'} onChange={event => update({ per_page: event.target.value === '25' ? '' : event.target.value })}>
                {[5, 10, 15, 20, 25, 30, 50, 100].map(size => <option key={size}>{size}</option>)}
            </select>
        </label>
    </section>;
}
