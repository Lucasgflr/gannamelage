import { useId, useState, type FormEvent } from 'react';
import { advancedFilters, mainFilters, type Filter } from '../hooks/usePropertyFilters';
import { propertyTypes } from '../types/property';
import Sheet from './Sheet';

const ranges = ['price', 'built_area', 'land_area', 'condo_price', 'iptu'] as const;
const integerKeys = ['bedrooms', 'suites', 'bathrooms', 'garage_spots'];

export default function FilterSheet({ params, close, apply }: {
    params: Record<string, string>;
    close: () => void;
    apply: (values: Partial<Record<Filter, string>>) => void;
}) {
    const [error, setError] = useState('');
    const formId = useId();

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        for (const range of ranges) {
            const min = String(fields.get(`min_${range}`) ?? '');
            const max = String(fields.get(`max_${range}`) ?? '');
            if (min && max && Number(min) > Number(max)) {
                setError('O valor mínimo deve ser menor ou igual ao máximo.');
                return;
            }
        }
        apply(Object.fromEntries(Array.from(fields, ([key, value]) => [key, String(value).trim()])));
        close();
    }

    function field([key, label]: [string, string]) {
        if (key === 'property_type') return <label key={key}>{label}
            <select name={key} defaultValue={params[key] ?? ''}>
                <option value="">Todos os tipos</option>
                {params[key] && !Object.hasOwn(propertyTypes, params[key]) && <option value={params[key]}>{params[key]}</option>}
                {Object.entries(propertyTypes).map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select>
        </label>;
        const isText = key.startsWith('address_');
        return <label key={key}>{label}
            <input name={key} defaultValue={params[key] ?? ''} type={isText ? 'text' : 'number'}
                maxLength={isText ? 255 : undefined} min={isText ? undefined : '0'}
                step={integerKeys.includes(key) ? '1' : 'any'} inputMode={isText ? 'text' : integerKeys.includes(key) ? 'numeric' : 'decimal'} />
        </label>;
    }

    return <Sheet title="Filtrar imóveis" close={close} footer={<button className="btn primary" form={formId}>Aplicar filtros</button>}>
        <form id={formId} className="stack" onSubmit={submit}>
            <div className="field-grid">{Object.entries(mainFilters).map(field)}</div>
            <details open={Object.keys(advancedFilters).some(key => params[key]) || undefined}>
                <summary className="filter-summary">Filtros avançados</summary>
                <div className="field-grid">{Object.entries(advancedFilters).map(field)}</div>
            </details>
            {error && <p role="alert">{error}</p>}
        </form>
    </Sheet>;
}
