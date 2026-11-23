import type { Property } from '../types/property';

export function publicUrl(property: Pick<Property, 'slug' | 'status'>) {
    return property.slug && property.status !== 'draft'
        ? new URL(`/p/${encodeURIComponent(property.slug)}`, window.location.origin).href
        : null;
}

export function whatsappUrl(title: string, url: string) {
    return `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;
}
