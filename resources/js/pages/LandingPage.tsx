import { Link, useLocation } from 'react-router-dom';
import { PropertyRoute } from './PropertyView';

export default function LandingPage({ authenticated, logout }: {
    authenticated: boolean;
    logout: () => Promise<void>;
}) {
    const location = useLocation();
    return <main className="public-page">
        <PropertyRoute isPublic authenticated={authenticated} />
        <footer className="details">
            {authenticated
                ? <button className="btn" onClick={() => void logout().catch(() => {})}>Sair da área do corretor</button>
                : <Link className="muted text-sm" to="/login" state={{ from: location.pathname + location.search }}>Acesso para corretores</Link>}
        </footer>
    </main>;
}
