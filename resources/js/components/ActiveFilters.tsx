import { filterLabels, type Filter } from '../hooks/usePropertyFilters';
import { propertyTypes, statuses, type Status } from '../types/property';

export default function ActiveFilters({ params, remove, clear }: {
    params: Record<string, string>;
    remove: (key: Filter) => void;
    clear: () => void;
}) {
    const active = (Object.keys(filterLabels) as Filter[]).filter(key => params[key]);
    if (!active.length) return null;

    return <div className="row wrap" aria-label="Filtros ativos" role="group">
        {active.map(key => {
            const value = key === 'status' ? statuses[params[key] as Status] ?? params[key]
                : key === 'property_type' ? propertyTypes[params[key]] ?? params[key] : params[key];
            return <button className="btn chip" key={key} aria-label={`Remover filtro ${filterLabels[key]}: ${value}`} onClick={() => remove(key)}>
                {filterLabels[key]}: {value} <span aria-hidden="true">×</span>
            </button>;
        })}
        <button className="btn quiet" onClick={clear}>Limpar filtros</button>
    </div>;
}
