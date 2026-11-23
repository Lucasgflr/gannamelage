import { Link, Outlet, useLocation } from 'react-router-dom';

const destinations = [
    { path: '/', label: 'Imóveis', icon: 'building' },
    { path: '/?buscar=1', label: 'Buscar', icon: 'magnifying-glass' },
    { path: '/properties/create', label: 'Cadastrar', icon: 'plus' },
];

export default function Layout({ logout }: { logout: () => Promise<void> }) {
    const { pathname, search } = useLocation();
    const searching = pathname === '/' && new URLSearchParams(search).has('buscar');

    return <div className="app-shell">
        <header className="topbar">
            <div className="topbar-inner">
                <Link className="brand" to="/">
                    <span className="brand-icon"><i className="fa-solid fa-building" aria-hidden="true" /></span>
                    <span>Gannam &amp; Lage<small>Vendas</small></span>
                </Link>
                <button className="btn quiet" onClick={() => void logout().catch(() => {})}>
                    <i className="fa-solid fa-arrow-right-from-bracket" aria-hidden="true" /> Sair
                </button>
            </div>
        </header>
        <main className="workspace"><Outlet /></main>
        <nav className="navigation" aria-label="Navegação interna">
            {destinations.map(({ path, label, icon }) => {
                const active = label === 'Buscar' ? searching :
                    label === 'Imóveis' ? !searching && pathname !== '/properties/create' : pathname === path;
                return <Link to={path} key={path} aria-current={active ? 'page' : undefined}>
                    <i className={`fa-solid fa-${icon}`} aria-hidden="true" /> {label}
                </Link>;
            })}
        </nav>
    </div>;
}
