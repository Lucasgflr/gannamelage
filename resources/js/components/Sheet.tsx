import { useEffect, useId, useRef, type KeyboardEventHandler, type ReactNode } from 'react';

export default function Sheet({ title, children, close, onKeyDown }: {
    title: string;
    children: ReactNode;
    close: () => void;
    onKeyDown?: KeyboardEventHandler<HTMLDialogElement>;
}) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();

    useEffect(() => {
        const dialog = ref.current!;
        dialog.showModal();
        return () => dialog.close();
    }, []);

    return <dialog ref={ref} className="sheet" aria-labelledby={titleId} onKeyDown={onKeyDown}
        onCancel={event => { event.preventDefault(); close(); }}
        onClick={event => { if (event.target === event.currentTarget) close(); }}>
        <div className="sheet-content">
            <header className="row spread">
                <h2 id={titleId}>{title}</h2>
                <button type="button" className="btn quiet" aria-label="Fechar" onClick={close}>✕</button>
            </header>
            {children}
        </div>
    </dialog>;
}
