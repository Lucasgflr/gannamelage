import { useId, useState, type FormEvent } from 'react';
import { advancedFilters, mainFilters, type Filter } from '../hooks/usePropertyFilters';
import { propertyTypes } from '../types/property';
import Sheet from './Sheet';
import LocationFilters from './LocationFilters';
import PriceThousandsField from './PriceThousandsField';
import { parsePriceThousands, reaisToThousands } from '../utils/price';
import type { useLocationOptions } from '../hooks/useLocationOptions';

const ranges = ['price', 'built_area', 'land_area', 'condo_price', 'iptu'] as const;
const integerKeys = ['bedrooms', 'suites', 'bathrooms', 'garage_spots'];

export default function FilterSheet({ params, close, apply, locations }: {
    params: Record<string, string>;
    close: () => void;
    locations: ReturnType<typeof useLocationOptions>;
    apply: (values: Partial<Record<Filter, string>>) => void;
}) {
    const [error, setError] = useState('');
    const formId = useId();
    const [minimum, setMinimum] = useState(() => reaisToThousands(params.min_price));
    const [maximum, setMaximum] = useState(() => reaisToThousands(params.max_price));

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const fields = new FormData(event.currentTarget);
        if (locations.data) {
            fields.set('address_city', String(fields.get('address_city') ?? ''));
            fields.set('address_neighborhood', String(fields.get('address_neighborhood') ?? ''));
        }
        for (const [key, input] of [['min_price', minimum], ['max_price', maximum]]) {
            const reais = input.trim() ? parsePriceThousands(input) : '';
            if (reais === null) {
                setError('Informe preços válidos em R$ mil.');
                return;
            }
            fields.set(key, reais);
        }
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
        return <label key={key}>{label}
            <input name={key} defaultValue={params[key] ?? ''} type="number" min="0"
                step={integerKeys.includes(key) ? '1' : 'any'} inputMode={integerKeys.includes(key) ? 'numeric' : 'decimal'} />
        </label>;
    }

    return <Sheet title="Filtrar imóveis" close={close} footer={<button className="btn primary" form={formId}>Aplicar filtros</button>}>
        <form id={formId} className="stack" onSubmit={submit}>
            <div className="field-grid">
                {locations.data ? <LocationFilters cities={locations.data.cities} states={locations.data.states} initialState={params.address_state} initialCity={params.address_city}
                    initialNeighborhood={params.address_neighborhood} /> :
                    <div style={{ gridColumn: '1 / -1' }}>
                        {locations.isError ? <>
                            <p role="alert">Não foi possível carregar cidades e bairros.</p>
                            <button type="button" className="btn" onClick={() => void locations.refetch()}>Tentar novamente</button>
                        </> : <p className="muted">Carregando cidades e bairros…</p>}
                    </div>}
                {field(['property_type', mainFilters.property_type])}
                {field(['bedrooms', mainFilters.bedrooms])}
                <PriceThousandsField label={mainFilters.min_price} value={minimum} change={setMinimum} />
                <PriceThousandsField label={mainFilters.max_price} value={maximum} change={setMaximum} />
            </div>
            <details open={Object.keys(advancedFilters).some(key => params[key]) || undefined}>
                <summary className="filter-summary">Filtros avançados</summary>
                <div className="field-grid">{Object.entries(advancedFilters).map(field)}</div>
            </details>
            {error && <p role="alert">{error}</p>}
        </form>
    </Sheet>;
}
