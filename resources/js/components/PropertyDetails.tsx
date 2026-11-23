import { useState } from 'react';
import { Link } from 'react-router-dom';
import { coverPhoto, locationLabel, money, photoUrl, statuses, type Property } from '../types/property';
import { publicUrl } from '../services/share';
import ShareButton from './ShareButton';
import Sheet from './Sheet';

const features = [
    ['bedrooms', 'Quartos'], ['suites', 'Suítes'], ['bathrooms', 'Banheiros'], ['garage_spots', 'Vagas'],
    ['land_area', 'Terreno (m²)'], ['built_area', 'Área construída (m²)'],
] as const;

export default function PropertyDetails({ property, isPublic }: { property: Property; isPublic: boolean }) {
    const [photoIndex, setPhotoIndex] = useState<number | null>(null);
    const cover = coverPhoto(property);
    const photos = cover ? [cover, ...property.photos.filter(photo => photo.id !== cover.id)] : [];
    const url = publicUrl(property);

    function move(amount: number) {
        setPhotoIndex(current => current === null ? null : (current + amount + photos.length) % photos.length);
    }

    return <article className="details stack">
        {isPublic ? <header className="brand">Gannam &amp; Lage <small>Vendas</small></header> :
            <div className="row wrap">
                <Link className="btn" to="/">Voltar</Link>
                <Link className="btn" to={`/properties/${property.id}/edit`}>Editar</Link>
                {url && <><a className="btn" href={url}>Ver página pública</a><ShareButton property={property} /></>}
            </div>}
        {cover && <button className="detail-cover" onClick={() => setPhotoIndex(0)} aria-label="Ampliar foto principal">
            <img src={photoUrl(cover)} alt={property.title} />
        </button>}
        <div>
            <span className={`status ${property.status}`}>{statuses[property.status]}</span>
            <h1>{property.title}</h1>
            <p className="muted">{locationLabel(property)}</p>
            <p className="price">{money.format(Number(property.sale_price))}</p>
        </div>
        <dl className="details-grid">
            {features.map(([key, label]) => <div key={key} className="panel"><dt>{label}</dt><dd>{property[key] ?? '—'}</dd></div>)}
        </dl>
        <section><h2>Sobre o imóvel</h2><p className="description">{property.description || 'Sem descrição.'}</p></section>
        <section><h2>Endereço</h2>
            <p>{[property.address_street, property.address_number, property.address_complement].filter(Boolean).join(', ')}</p>
            <p>{locationLabel(property)} {property.address_zip && ` · CEP ${property.address_zip}`}</p>
        </section>
        {!isPublic && <section className="panel stack"><h2>Dados do proprietário</h2>
            <dl className="details-grid">
                <div><dt>Nome</dt><dd>{property.owner?.name || 'Não informado'}</dd></div>
                <div><dt>Telefone</dt><dd>{property.owner?.phone || 'Não informado'}</dd></div>
                <div><dt>E-mail</dt><dd>{property.owner?.email || 'Não informado'}</dd></div>
            </dl>
        </section>}
        {photos.length > 0 && <section><h2>Galeria de fotos</h2><div className="photo-grid">
            {photos.map((photo, index) => <button key={photo.id} onClick={() => setPhotoIndex(index)} aria-label={`Ampliar foto ${index + 1}`}>
                <img loading="lazy" src={photoUrl(photo)} alt={`Foto ${index + 1}`} />
            </button>)}
        </div></section>}
        {photoIndex !== null && photos[photoIndex] && <Sheet title={`Foto ${photoIndex + 1} de ${photos.length}`} close={() => setPhotoIndex(null)}>
            <div onKeyDown={event => {
                if (event.key === 'ArrowLeft') move(-1);
                if (event.key === 'ArrowRight') move(1);
            }}>
                <img className="lightbox-image" src={photoUrl(photos[photoIndex])} alt={`Foto ${photoIndex + 1}`} />
                {photos.length > 1 && <div className="row spread">
                    <button className="btn" onClick={() => move(-1)}>Anterior</button>
                    <button className="btn" onClick={() => move(1)}>Próxima</button>
                </div>}
            </div>
        </Sheet>}
    </article>;
}
