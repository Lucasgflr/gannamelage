import { useState } from 'react';
import { publicUrl, whatsappUrl } from '../services/share';
import type { Property } from '../types/property';
import Sheet from './Sheet';

export default function ShareButton({ property }: { property: Pick<Property, 'slug' | 'status' | 'title'> }) {
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const url = publicUrl(property);

    async function share() {
        if (!url) return;
        const data = { title: property.title, url };
        if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
            try {
                await navigator.share(data);
                return;
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') return;
            }
        }
        setFeedback('');
        setOpen(true);
    }

    async function copy() {
        try {
            await navigator.clipboard.writeText(url!);
            setFeedback('Link copiado.');
        } catch {
            setFeedback('Selecione o link e copie manualmente.');
        }
    }

    return <>
        <button type="button" className="btn share" disabled={!url} onClick={() => void share()}>
            <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" /> Compartilhar
        </button>
        {url && open && <Sheet title="Compartilhar imóvel" close={() => setOpen(false)}>
            <a className="btn primary" target="_blank" rel="noopener noreferrer" href={whatsappUrl(property.title, url)}>WhatsApp</a>
            <button type="button" className="btn" onClick={() => void copy()}>Copiar link</button>
            <label>Link público<input readOnly value={url} onFocus={event => event.currentTarget.select()} /></label>
            <p role="status">{feedback}</p>
        </Sheet>}
    </>;
}
