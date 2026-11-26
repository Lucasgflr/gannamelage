import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PropertyForm = lazy(() => import('./pages/PropertyForm'));
const PropertyView = lazy(() => import('./pages/PropertyView'));
const LandingPage = lazy(() => import('./pages/LandingPage'));

function EditRoute() {
    const { id } = useParams();
    return <PropertyForm key={id} id={id} />;
}

export default function AppRoutes({ authenticated, logout, loginScreen }: {
    authenticated: boolean;
    logout: () => Promise<void>;
    loginScreen: ReactNode;
}) {
    const location = useLocation();
    const redirect = location.state?.from;
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect : '/';

    return <Suspense fallback={<p className="workspace" role="status">Carregando…</p>}>
        <Routes>
            <Route path="/p/:slug" element={<LandingPage authenticated={authenticated} logout={logout} />} />
            <Route path="/login" element={authenticated ? <Navigate to={destination} replace /> : loginScreen} />
            <Route element={authenticated ? <Layout logout={logout} /> :
                <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/properties/create" element={<PropertyForm key="create" />} />
                <Route path="/properties/:id/edit" element={<EditRoute />} />
                <Route path="/properties/:id/view" element={<PropertyView />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    </Suspense>;
}
