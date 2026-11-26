import axios, { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { blankProperty, illustrativePhoto, sampleProperties } from './fixtures';
import type { Photo, Property, PropertyPage } from '../resources/js/types/property';

import { activeReservation, profiles, release, reserve, sessionKey } from './reservations';
import { cleanLocation, locationKey, searchLocationKey } from '../resources/js/utils/location';

function citiesIn(properties: Property[], keyOf = locationKey) {
    const cities = new Map<string, { name: string; neighborhoods: Map<string, string> }>();
    for (const property of properties) {
        const name = cleanLocation(property.address_city);
        if (!name) continue;
        const key = keyOf(name);
        const city = cities.get(key) ?? { name, neighborhoods: new Map<string, string>() };
        const neighborhood = cleanLocation(property.address_neighborhood);
        const neighborhoodKey = keyOf(neighborhood);
        if (neighborhood && !city.neighborhoods.has(neighborhoodKey)) city.neighborhoods.set(neighborhoodKey, neighborhood);
        cities.set(key, city);
    }
    const compare = (a: string, b: string) => a.localeCompare(b, 'pt-BR');
    return [...cities.values()].sort((a, b) => compare(a.name, b.name))
        .map(city => ({ name: city.name, neighborhoods: [...city.neighborhoods.values()].sort(compare) }));
}

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

function list(properties: Property[], params: Record<string, string>, profile: string): PropertyPage {
    const search = normalize(params.search ?? '');
    const code = search.match(/^(?:#\s*|(?:id|codigo|cod\.?)\s*:?\s*)?(\d+)$/)?.[1];
    const minimums = ['bedrooms', 'suites', 'bathrooms', 'garage_spots'] as const;
    const amounts = { price: 'sale_price', built_area: 'built_area', land_area: 'land_area', condo_price: 'condo_price', iptu: 'iptu' } as const;

    const rows = properties.map(property => ({
        ...property, active_reservation: activeReservation(property.id, profile),
    })).filter(property => {
        const reservation = property.active_reservation;
        if (params.visit === 'free' && (property.status !== 'available' || reservation)) return false;
        if (params.visit === 'reserved' && !reservation) return false;
        if (params.visit === 'mine' && !reservation?.mine) return false;
        if (params.address_state && property.address_state?.toUpperCase() !== params.address_state.toUpperCase()) return false;
        if (params.status && params.status !== property.status) return false;
        if (params.property_type && params.property_type !== property.property_type) return false;
        if (search && !(code ? Number(code) === property.id : [
            property.title, property.description, property.address_city, property.address_neighborhood, property.slug,
        ].some(value => value && normalize(value).includes(search)))) return false;
        const keyOf = params.address_state ? searchLocationKey : locationKey;
        for (const field of ['address_city', 'address_neighborhood'] as const) {
            if (!params[field]) continue;
            const matches = params.location_exact === '1'
                ? keyOf(property[field]) === keyOf(params[field])
                : normalize(property[field] ?? '').includes(normalize(params[field]));
            if (!matches) return false;
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
        const profile = sessionStorage.getItem(sessionKey) ?? '';
        const { properties: rows, lastId } = read();
        const nextId = lastId + 1;
        const respond = (data: unknown, status = 200): AxiosResponse => ({ data, status, statusText: '', headers: {}, config });
        const save = (property: Property, status = 200) => {
            const reservation = activeReservation(property.id, profile);
            if (property.status !== 'available' && reservation) release(reservation.id, profile, 'commercial_status');
            write([...rows.filter(row => row.id !== property.id), property], Math.max(lastId, property.id));
            return respond(property, status);
        };
        const fail = (message: string, status: number, data = {}) =>
            new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, undefined, respond({ message, ...data }, status));
        const notFound = () => fail('Imóvel demonstrativo não encontrado.', 404);

        if (url.startsWith('/api/public/properties/') && method === 'get') {
            const slug = decodeURIComponent(url.split('/').at(-1) ?? '');
            const property = rows.find(row => row.slug === slug && row.status !== 'draft');
            if (!property) throw notFound();
            return respond({
                id: property.id, slug: property.slug, title: property.title, description: property.description,
                property_type: property.property_type, status: property.status, sale_price: property.sale_price,
                condo_price: property.condo_price, iptu: property.iptu, bedrooms: property.bedrooms,
                suites: property.suites, bathrooms: property.bathrooms, garage_spots: property.garage_spots,
                land_area: property.land_area, built_area: property.built_area, photos: property.photos,
                address_neighborhood: property.address_neighborhood, address_city: property.address_city, address_state: property.address_state,
            });
        }
        if (!profiles.includes(profile)) throw fail('Entre com um perfil demonstrativo.', 401);
        if (url === '/api/properties/filter-options' && method === 'get') {
            const states = [...new Set(rows.flatMap(row => row.address_state ? [row.address_state.toUpperCase()] : []))]
                .sort().map(uf => ({ uf, cities: citiesIn(rows.filter(row => row.address_state?.toUpperCase() === uf), searchLocationKey) }));
            return respond({ cities: citiesIn(rows), states });
        }
        if (url === '/api/properties') {
            if (method === 'get') return respond(list(rows, config.params ?? {}, profile));
            if (method === 'post') return save(patchProperty(blankProperty(nextId), config), 201);
        }

        const route = url.match(/^\/api\/properties\/(\d+)(?:\/(sell|duplicate|photos|internal|reserve|release-reservation)(?:\/(\d+))?)?$/);
        const property = rows.find(row => row.id === Number(route?.[1]));
        if (!property || !route) throw notFound();
        const [, , action, photoId] = route;

        const reservation = activeReservation(property.id, profile);
        if (action === 'internal' && method === 'get') return respond({
            owner: property.owner ?? null, status: property.status, active_reservation: reservation,
            address: [property.address_street, property.address_number, property.address_complement,
                property.address_neighborhood, property.address_city, property.address_state, property.address_zip].filter(Boolean).join(', '),
        });
        if (action === 'reserve' && method === 'post') {
            if (property.status !== 'available') throw fail('Este imóvel não está disponível para visitas.', 409);
            if (reservation) throw fail(reservation.mine ? 'Você já possui uma reserva ativa para este imóvel.'
                : `Este imóvel já está reservado pelo corretor ${reservation.broker} até o final do dia.`, 409, { active_reservation: reservation });
            return respond({
                message: 'Imóvel reservado com sucesso até o final do dia.',
                active_reservation: reserve(property.id, profile),
            }, 201);
        }
        if (action === 'release-reservation' && method === 'post') {
            if (!reservation || reservation.id !== JSON.parse(config.data ?? '{}').reservation_id) {
                throw fail('A reserva mudou. Consulte a disponibilidade atual do imóvel.', 409);
            }
            if (!reservation.mine) throw fail('Somente o corretor responsável pode liberar este imóvel.', 403);
            release(reservation.id, profile, 'manual');
            return respond({ message: 'Imóvel liberado para visitas.', active_reservation: null });
        }

        if (!action && method === 'get') return respond(property);
        if (!action && method === 'put') return save(patchProperty(property, config));
        if (!action && method === 'delete') {
            if (reservation) release(reservation.id, profile, 'deleted');
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
