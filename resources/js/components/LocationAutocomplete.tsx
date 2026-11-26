import { useId, useState } from 'react';
import { searchLocationKey } from '../utils/location';

export interface LocationOption { value: string; label?: string }

export default function LocationAutocomplete({ label, value, options, change, custom = false, disabled = false }: {
    label: string;
    value: string;
    options: LocationOption[];
    change: (value: string) => void;
    custom?: boolean;
    disabled?: boolean;
}) {
    const id = useId();
    const [input, setInput] = useState<string | null>(null);
    const [active, setActive] = useState(-1);
    const matches = options.filter(option =>
        searchLocationKey(`${option.value} ${option.label ?? ''}`).includes(searchLocationKey(input)),
    ).slice(0, 60);
    const selected = options.find(option => option.value === value);
    const open = input !== null;

    function select(option: LocationOption) {
        change(option.value);
        setInput(null);
        setActive(-1);
    }

    return <div className="location-autocomplete">
        <label htmlFor={id}>{label}</label>
        <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={open}
            aria-controls={`${id}-options`} aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
            value={input ?? (custom ? value : selected?.label ?? value)} maxLength={255}
            disabled={disabled} autoComplete="off"
            onFocus={event => { event.currentTarget.select(); setInput(custom ? value : ''); }}
            onBlur={() => { setInput(null); setActive(-1); }}
            onChange={event => {
                setInput(event.target.value);
                setActive(-1);
                if (custom) change(event.target.value);
                else if (!event.target.value && !selected && value) change('');
            }}
            onKeyDown={event => {
                if (event.key === 'Escape') { setInput(null); setActive(-1); }
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    if (!open) setInput('');
                    const next = Math.min(matches.length - 1, Math.max(0, active + (event.key === 'ArrowDown' ? 1 : -1)));
                    setActive(next);
                    document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: 'nearest' });
                }
                if (event.key === 'Enter' && open) {
                    event.preventDefault();
                    if (matches[active]) select(matches[active]);
                    else if (matches.length === 1 && !custom) select(matches[0]);
                    else { setInput(null); setActive(-1); }
                }
            }} />
        <div className="location-options" hidden={!open}>
            <div id={`${id}-options`} role="listbox" aria-label={label}>
                {matches.map((option, index) => <div role="option" key={option.value} id={`${id}-${index}`}
                    aria-selected={active === index} onMouseDown={event => event.preventDefault()}
                    onClick={() => select(option)}>{option.label ?? option.value}</div>)}
            </div>
            {matches.length === 0 && <p role="status">{custom ? 'Sem sugestões. Você pode informar um novo bairro.' : 'Sem sugestões.'}</p>}
        </div>
    </div>;
}
