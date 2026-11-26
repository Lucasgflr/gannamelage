import { propertyTypes } from '../types/property';
import { cleanLocation, searchLocationKey } from './location';

const prepositions: Record<string, string> = { centro: 'no', federal: 'no', 'vila nova': 'na' };

export function propertyTitle(type: string, state: string, city: string, neighborhood: string, suffix: string) {
    const label = propertyTypes[type] ?? type;
    const local = state === 'MG' && searchLocationKey(city) === 'sao lourenco' && cleanLocation(neighborhood);
    const place = local || cleanLocation(city);
    const prefix = place ? `${label} ${local && prepositions[searchLocationKey(local)] || 'em'} ${place}` : label;
    return [prefix, suffix.trim()].filter(Boolean).join(' ');
}
