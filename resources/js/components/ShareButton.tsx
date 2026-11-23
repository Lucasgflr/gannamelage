import { useState } from 'react';
import { publicUrl, whatsappUrl } from '../services/share';
import type { Property } from '../types/property';
import Sheet from './Sheet';

export default function ShareButton({ property }: { property: Pick<Property, 'slug' | 'status' | 'title'> }) {
    const [open, setOpen] = useState(false);
    const [feedback, setFeedback] = useState('');
    const url = publicUrl(property);
    const shareData = url ? { title: property.title, url } : null;
    const canShare = shareData && Boolean(navigator.share) && (!navigator.canShare || navigator.canShare(shareData));

    async function share() {
        if (!shareData) return;
        try {
            await navigator.share(shareData);
            setOpen(false);
        } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') return;
            setFeedback('O compartilhamento do dispositivo falhou. Use o WhatsApp ou copie o link.');
        }
    }

    async function copy(link: string) {
        try {
            await navigator.clipboard.writeText(link);
            setFeedback('Link copiado.');
        } catch {
            setFeedback('Selecione o link e copie manualmente.');
        }
    }

    return <>
        <button type="button" className="btn share" disabled={!url} aria-haspopup="dialog" onClick={() => {
            setFeedback('');
            setOpen(true);
        }}>
            <i className="fa-solid fa-arrow-up-from-bracket" aria-hidden="true" /> Compartilhar
        </button>
        {url && open && <Sheet title="Compartilhar imóvel" close={() => setOpen(false)}>
            {canShare && <button type="button" className="btn" onClick={() => void share()}>Compartilhar pelo dispositivo</button>}
            <a className="btn primary" target="_blank" rel="noopener noreferrer" href={whatsappUrl(property.title, url)}>WhatsApp</a>
            <button type="button" className="btn" onClick={() => void copy(url)}>Copiar link</button>
            <label>Link público<input readOnly value={url} onFocus={event => event.currentTarget.select()} /></label>
            <p role="status">{feedback}</p>
        </Sheet>}
    </>;
}
