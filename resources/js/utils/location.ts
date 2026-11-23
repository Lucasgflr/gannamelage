export function cleanLocation(value?: string | null) {
    return (value ?? '').replace(/\s+/g, ' ').trim();
}

export function locationKey(value?: string | null) {
    return cleanLocation(value).toLocaleLowerCase('pt-BR');
}
