export const statuses = {
    draft: 'Rascunho',
    available: 'Disponível',
    reserved: 'Reservado',
    sold: 'Vendido',
} as const;

export type Status = keyof typeof statuses;

export const propertyTypes: Record<string, string> = {
    casa: 'Casa', apartamento: 'Apartamento', sobrado: 'Sobrado', cobertura: 'Cobertura',
    duplex: 'Duplex', mansao: 'Mansão', chale: 'Chalé', casa_condominio: 'Casa em condomínio',
    comercial: 'Comercial', industrial: 'Industrial', terreno: 'Terreno',
    terreno_rural: 'Terreno rural', fazenda: 'Fazenda', sito_chacara: 'Sítio/Chácara',
    propriedade_rural: 'Propriedade rural',
};

export interface Photo {
    id: number;
    path: string;
    is_main: boolean;
    order: number;
}

export interface Owner {
    name: string | null;
    phone: string | null;
    email: string | null;
}

export interface Property {
    id: number;
    slug: string;
    title: string;
    description: string | null;
    property_type: string;
    status: Status;
    sale_price: string | number;
    condo_price: string | number | null;
    iptu: string | number | null;
    bedrooms: number | null;
    suites: number | null;
    bathrooms: number | null;
    garage_spots: number | null;
    land_area: string | number | null;
    built_area: string | number | null;
    address_street: string | null;
    address_number: string | null;
    address_complement: string | null;
    address_neighborhood: string | null;
    address_city: string | null;
    address_state: string | null;
    address_zip: string | null;
    photos: Photo[];
    owner?: Owner | null;
}

export interface PropertyPage {
    data: Property[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

export const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const photoUrl = (photo: Photo) => `/storage/${photo.path}`;
export const coverPhoto = (property: Pick<Property, 'photos'>) => property.photos.find(photo => photo.is_main) ?? property.photos[0];
export const locationLabel = (property: Property) =>
    [property.address_neighborhood, [property.address_city, property.address_state].filter(Boolean).join('/')].filter(Boolean).join(' · ');
