export function cleanLocation(value?: string | null) {
    return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function locationKey(value?: string | null) {
    return cleanLocation(value).toLocaleLowerCase('pt-BR');
}

export function searchLocationKey(value?: string | null) {
    return locationKey(value).normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
