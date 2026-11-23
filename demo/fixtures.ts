import type { Photo, Property, Status } from '../resources/js/types/property';
import exterior from './photos/casa.jpg';
import interior from './photos/interior.jpg';

export function illustrativePhoto(id: number, isMain: boolean, order = 0): Photo {
    const path = order % 2 === 0 ? 'casa.jpg' : 'interior.jpg';
    const previewUrl = order % 2 === 0 ? exterior : interior;
    return { id, path, previewUrl, is_main: isMain, order };
}

const headlines = [
    'Casa de demonstração no Bosque', 'Apartamento de demonstração com varanda',
    'Casa de demonstração na Colina', 'Apartamento de demonstração no Lago',
    'Casa de demonstração com jardim', 'Apartamento de demonstração na Praça',
    'Casa de demonstração com terraço', 'Apartamento de demonstração no Parque',
    'Casa de demonstração com pátio',
];
const exampleStatuses: Status[] = ['available', 'available', 'draft', 'reserved', 'available', 'sold', 'available', 'available', 'draft'];

export function blankProperty(id: number): Property {
    return {
        id, slug: `imovel-demo-${id}`, title: '', description: null, property_type: 'casa', status: 'draft',
        sale_price: 0, condo_price: 0, iptu: null, bedrooms: 0, suites: 0, bathrooms: 0, garage_spots: 0,
        land_area: null, built_area: null, address_street: null, address_number: null, address_complement: null,
        address_neighborhood: null, address_city: null, address_state: null, address_zip: null, photos: [],
    };
}

export const sampleProperties: Property[] = headlines.map((title, index) => {
    const id = index + 1;
    const house = index % 2 === 0;
    return {
        ...blankProperty(id), title, status: exampleStatuses[index], property_type: house ? 'casa' : 'apartamento',
        description: 'Imóvel fictício para explorar o painel. Fotografias ilustrativas.',
        sale_price: 410000 + index * 56000, condo_price: house ? 0 : 420, iptu: 450 + index * 90,
        bedrooms: house ? 3 : 2, suites: 1, bathrooms: 2, garage_spots: house ? 2 : 1,
        land_area: house ? 230 : null, built_area: house ? 147 : 88,
        address_city: index < 6 ? 'Vila Exemplo' : 'Cidade Modelo',
        address_neighborhood: house ? 'Jardim Modelo' : 'Bairro Ilustrativo',
        address_street: 'Rua de Demonstração', address_number: String(100 + index), address_state: 'MG',
        owner: { name: `Proprietário fictício ${id}`, phone: null, email: `contato${id}@example.invalid` },
        photos: [illustrativePhoto(id * 100, true), illustrativePhoto(id * 100 + 1, false, 1)],
    };
});
