import { useId } from 'react';
import { money } from '../types/property';
import { parsePriceThousands } from '../utils/price';

export default function PriceThousandsField({ label, value, change, required }: {
    label: string;
    value: string;
    change: (value: string) => void;
    required?: boolean;
}) {
    const id = useId();
    const reais = parsePriceThousands(value);
    const invalid = value.trim() !== '' && reais === null;

    return <div className="stack" style={{ gap: '.25rem', alignContent: 'start' }}>
        <label htmlFor={id}>{label} (R$ mil)</label>
        <input id={id} type="text" inputMode="decimal" maxLength={32} value={value} required={required}
            aria-describedby={`${id}-preview`} aria-invalid={invalid || undefined}
            onChange={event => change(event.target.value)} />
        <small className="muted" id={`${id}-preview`}>
            {invalid ? 'Use vírgula para decimais, como 650,5.' : reais === null ? 'Ex.: 650 = R$ 650.000,00' : money.format(Number(reais))}
        </small>
    </div>;
}
