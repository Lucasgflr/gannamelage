import { statuses } from '../types/property';

export default function StatusTabs({ value, change }: { value: string; change: (status: string) => void }) {
    return <div className="status-tabs" role="group" aria-label="Status dos imóveis">
        {[['', 'Todos'], ...Object.entries(statuses)].map(([status, label]) =>
            <button type="button" className="btn" aria-pressed={status === value} key={status} onClick={() => change(status)}>
                {label}
            </button>,
        )}
    </div>;
}
