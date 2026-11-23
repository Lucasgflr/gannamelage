import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppRoutes from './AppRoutes';
import { useAuth } from './hooks/useAuth';
import Login from './pages/Login';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } });

function App() {
    const { authenticated, login, logout } = useAuth();
    return <AppRoutes authenticated={authenticated} logout={logout} loginScreen={<Login login={login} />} />;
}

createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={queryClient}>
        <BrowserRouter><App /></BrowserRouter>
    </QueryClientProvider>,
);
