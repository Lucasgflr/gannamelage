import { useEffect, useRef, useState, type FormEvent } from 'react';

export default function SearchBar({ search, change, focus }: {
    search: string; change: (value: string) => void; focus: boolean;
}) {
    const [previous, setPrevious] = useState(search);
    const [draft, setDraft] = useState(search);
    if (previous !== search) {
        setPrevious(search);
        setDraft(search);
    }
    const input = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (focus) input.current?.focus();
    }, [focus]);

    useEffect(() => {
        if (draft.trim() === search) return;
        const timer = window.setTimeout(() => change(draft.trim()), 350);
        return () => window.clearTimeout(timer);
    }, [draft, search, change]);

    function submit(event: FormEvent) {
        event.preventDefault();
        if (draft.trim() !== search) change(draft.trim());
    }

    return <form className="search-row" role="search" onSubmit={submit}>
        <label htmlFor="property-search" className="sr-only">Buscar por título, localização ou código</label>
        <button className="btn search-submit" aria-label="Executar busca"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></button>
        <input id="property-search" ref={input} type="search" maxLength={255}
            placeholder="Título, bairro ou ID" value={draft} onChange={event => setDraft(event.target.value)} />
    </form>;
}
