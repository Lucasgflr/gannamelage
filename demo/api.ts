import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { blankProperty, illustrativePhoto, sampleProperties } from './fixtures';
import type { Photo, Property, PropertyPage } from '../resources/js/types/property';

const storageKey = 'gannamelage-demo:v1:properties';

interface Inventory {
    lastId: number;
    properties: Property[];
}

function read(): Inventory {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return { lastId: sampleProperties.length, properties: structuredClone(sampleProperties) };
    const { lastId, properties } = JSON.parse(saved) as Inventory;
    return {
        lastId,
        properties: properties.map(property => ({
            ...property,
            photos: property.photos.map(photo => ({
                ...photo,
                previewUrl: illustrativePhoto(photo.id, photo.is_main, photo.path === 'interior.jpg' ? 1 : 0).previewUrl,
            })),
        })),
    };
}

function write(properties: Property[], lastId: number) {
    const payload = properties.map(property => ({
        ...property,
        photos: property.photos.map(({ id, path, is_main, order }) => ({ id, path, is_main, order })),
    }));
    localStorage.setItem(storageKey, JSON.stringify({ properties: payload, lastId }));
}

const normalize = (text: string) => text.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();

function list(properties: Property[], params: Record<string, string>): PropertyPage {
    const search = normalize(params.search ?? '');
    const code = search.match(/^(?:#\s*|(?:id|codigo|cod\.?)\s*:?\s*)?(\d+)$/)?.[1];
    const minimums = ['bedrooms', 'suites', 'bathrooms', 'garage_spots'] as const;
    const amounts = { price: 'sale_price', built_area: 'built_area', land_area: 'land_area', condo_price: 'condo_price', iptu: 'iptu' } as const;

    const rows = properties.filter(property => {
        if (params.status && params.status !== property.status) return false;
        if (params.property_type && params.property_type !== property.property_type) return false;
        if (search && !(code ? Number(code) === property.id : [
            property.title, property.description, property.address_city, property.address_neighborhood, property.slug,
        ].some(value => value && normalize(value).includes(search)))) return false;
        for (const field of ['address_city', 'address_neighborhood'] as const) {
            if (params[field] && !normalize(property[field] ?? '').includes(normalize(params[field]))) return false;
        }
        for (const field of minimums) {
            if (params[field] && (property[field] === null || Number(property[field]) < Number(params[field]))) return false;
        }
        for (const [key, field] of Object.entries(amounts)) {
            const value = property[field];
            if (params[`min_${key}`] && (value === null || Number(value) < Number(params[`min_${key}`]))) return false;
            if (params[`max_${key}`] && (value === null || Number(value) > Number(params[`max_${key}`]))) return false;
        }
        return true;
    });

    rows.sort((a, b) => {
        switch (params.sort) {
            case 'oldest': return a.id - b.id;
            case 'title': return a.title.localeCompare(b.title, 'pt-BR') || a.id - b.id;
            case 'price_asc': return Number(a.sale_price) - Number(b.sale_price) || a.id - b.id;
            case 'price_desc': return Number(b.sale_price) - Number(a.sale_price) || a.id - b.id;
            default: return b.id - a.id;
        }
    });

    const perPage = [5, 10, 15, 20, 25, 30, 50, 100].find(size => size === Number(params.per_page)) ?? 25;
    const page = Math.max(1, Number.parseInt(params.page ?? '1', 10) || 1);
    const offset = (page - 1) * perPage;
    const data = rows.slice(offset, offset + perPage);
    return {
        data, current_page: page, last_page: Math.max(1, Math.ceil(rows.length / perPage)), total: rows.length,
        from: data.length ? offset + 1 : null, to: data.length ? offset + data.length : null,
    };
}

function patchProperty(property: Property, config: InternalAxiosRequestConfig): Property {
    const fields: Partial<Property> = JSON.parse(config.data ?? '{}');
    return {
        ...property, ...fields, id: property.id, slug: property.slug, photos: property.photos,
        owner: fields.owner?.name ? fields.owner : property.owner,
    };
}

// Axios is used as an in-process adapter, so shared screens never make HTTP requests.
export const api = axios.create({
    adapter: async config => {
        const url = config.url ?? '';
        const method = config.method;
        const { properties: rows, lastId } = read();
        const nextId = lastId + 1;
        const respond = (data: unknown, status = 200): AxiosResponse => ({ data, status, statusText: '', headers: {}, config });
        const save = (property: Property, status = 200) => {
            write([...rows.filter(row => row.id !== property.id), property], Math.max(lastId, property.id));
            return respond(property, status);
        };
        const notFound = () => {
            const message = 'Imóvel demonstrativo não encontrado.';
            return new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, undefined, respond({ message }, 404));
        };

        if (url.startsWith('/api/public/properties/') && method === 'get') {
            const slug = decodeURIComponent(url.split('/').at(-1) ?? '');
            const property = rows.find(row => row.slug === slug && row.status !== 'draft');
            if (!property) throw notFound();
            return respond({ ...property, owner: undefined });
        }
        if (url === '/api/properties') {
            if (method === 'get') return respond(list(rows, config.params ?? {}));
            if (method === 'post') return save(patchProperty(blankProperty(nextId), config), 201);
        }

        const route = url.match(/^\/api\/properties\/(\d+)(?:\/(sell|duplicate|photos)(?:\/(\d+))?)?$/);
        const property = rows.find(row => row.id === Number(route?.[1]));
        if (!property || !route) throw notFound();
        const [, , action, photoId] = route;

        if (!action && method === 'get') return respond(property);
        if (!action && method === 'put') return save(patchProperty(property, config));
        if (!action && method === 'delete') {
            write(rows.filter(row => row.id !== property.id), lastId);
            return respond({ message: 'Imóvel removido da demonstração.' });
        }
        if (action === 'sell' && method === 'post') return save({ ...property, status: 'sold' });
        if (action === 'duplicate' && method === 'post') {
            return save({ ...property, id: nextId, slug: blankProperty(nextId).slug, status: 'draft' }, 201);
        }
        if (action === 'photos' && method === 'post' && config.data instanceof FormData) {
            const main = config.data.get('is_main') === '1';
            const firstId = Math.max(0, ...property.photos.map(photo => photo.id)) + 1;
            const added: Photo[] = config.data.getAll('photos[]').map((_, index) =>
                illustrativePhoto(firstId + index, main && index === 0, property.photos.length + index),
            );
            save({ ...property, photos: [...property.photos.map(photo => main ? { ...photo, is_main: false } : photo), ...added] });
            return respond(added, 201);
        }
        if (action === 'photos' && method === 'delete' && photoId) {
            save({ ...property, photos: property.photos.filter(photo => photo.id !== Number(photoId)) });
            return respond({ message: 'Foto ilustrativa removida.' });
        }
        throw notFound();
    },
});

export function errorMessage(error: unknown, fallback: string) {
    return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data.message ?? fallback : fallback;
}
