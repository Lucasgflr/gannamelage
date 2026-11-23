import '@fortawesome/fontawesome-free/css/fontawesome.min.css';
import '@fortawesome/fontawesome-free/css/solid.min.css';
import '../resources/css/app.css';
import './demo.css';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import AppRoutes from '../resources/js/AppRoutes';

const profiles = ['Ana Exemplo', 'Rafael Modelo'];
const sessionKey = 'gannamelage-demo:v1:profile';
const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 15_000 } } });

function Demo() {
    const [profile, setProfile] = useState(() => sessionStorage.getItem(sessionKey) ?? '');
    const authenticated = profiles.includes(profile);

    async function logout() {
        sessionStorage.removeItem(sessionKey);
        client.clear();
        setProfile('');
    }

    return <>
        <aside className="demo-banner" aria-label="Ambiente demonstrativo">
            <strong>Demonstração</strong> · Dados fictícios. Use informações inventadas.
        </aside>
        <AppRoutes authenticated={authenticated} logout={logout} loginScreen={
            <main className="login-page demo-login">
                <form className="panel login-panel" onSubmit={event => {
                    event.preventDefault();
                    const selected = String(new FormData(event.currentTarget).get('profile'));
                    if (!profiles.includes(selected)) return;
                    sessionStorage.setItem(sessionKey, selected);
                    setProfile(selected);
                }}>
                    <span className="brand">Gannam &amp; Lage</span>
                    <h1>Entrar na demonstração</h1>
                    <label>Perfil fictício<select name="profile">
                        {profiles.map(name => <option key={name}>{name}</option>)}
                    </select></label>
                    <button className="btn primary">Entrar na demo</button>
                </form>
            </main>
        } />
    </>;
}

createRoot(document.getElementById('app')!).render(
    <QueryClientProvider client={client}>
        <HashRouter><Demo /></HashRouter>
    </QueryClientProvider>,
);
