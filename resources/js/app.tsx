import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import 'sweetalert2/dist/sweetalert2.min.css';
import { lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Layout from './components/Layout';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PropertyForm = lazy(() => import('./pages/PropertyForm'));
const PropertyView = lazy(() => import('./pages/PropertyView'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } });

function EditRoute() {
    const { id } = useParams();
    return <PropertyForm key={id} id={id} />;
}

function App() {
    const { authenticated, login, logout } = useAuth();
    const location = useLocation();
    const redirect = location.state?.from;
    const destination = typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
        ? redirect : '/';

    return <Suspense fallback={<p className="workspace" role="status">Carregando…</p>}>
        <Routes>
            <Route path="/p/:slug" element={<LandingPage />} />
            <Route path="/login" element={authenticated ? <Navigate to={destination} replace /> : <Login login={login} />} />
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

createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter><App /></BrowserRouter>
    </QueryClientProvider>,
);
