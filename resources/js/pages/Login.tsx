import { useState, type FormEvent } from 'react';
import { errorMessage } from '../services/api';

export default function Login({ login }: { login: (email: string, password: string) => Promise<void> }) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setError('');
        try {
            await login(String(form.get('email')), String(form.get('password')));
        } catch (failure) {
            setError(errorMessage(failure, 'Não foi possível entrar. Tente novamente.'));
        } finally {
            setBusy(false);
        }
    }

    return <main className="login-page">
        <form className="panel login-panel" onSubmit={submit}>
            <span className="brand"><i className="fa-solid fa-building" aria-hidden="true" /> Gannam &amp; Lage</span>
            <h1>Entrar no painel</h1>
            <label>E-mail<input name="email" type="email" autoComplete="username" required /></label>
            <label>Senha<input name="password" type="password" autoComplete="current-password" required /></label>
            {error && <p role="alert">{error}</p>}
            <button className="btn primary" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        </form>
    </main>;
}
