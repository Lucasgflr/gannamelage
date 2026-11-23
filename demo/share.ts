import type { Property } from '../resources/js/types/property';

export function publicUrl(property: Pick<Property, 'slug' | 'status'>) {
    return property.slug && property.status !== 'draft'
        ? new URL(`#/p/${encodeURIComponent(property.slug)}`, window.location.href).href
        : null;
}

export function whatsappUrl(title: string, url: string) {
    return `https://wa.me/?text=${encodeURIComponent(`Demonstração · ${title}\n${url}`)}`;
}
