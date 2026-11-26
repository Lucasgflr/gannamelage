import { Link } from 'react-router-dom';
import { coverPhoto, locationLabel, money, photoUrl, propertyTypes, statuses, type Property } from '../types/property';
import { visitStatus } from '../hooks/useVisitReservation';
import PropertyActions from './PropertyActions';

export default function PropertyCard({ property, notify }: { property: Property; notify: (message: string) => void }) {
    const photo = coverPhoto(property);
    return <article className="property-card">
        <Link className="card-image" to={`/properties/${property.id}/view`} aria-label={`Visualizar ${property.title}`}>
            {photo ? <img src={photoUrl(photo)} alt="" loading="lazy" /> :
                <i className="fa-solid fa-house text-3xl" aria-hidden="true" />}
            <span className={`status ${property.status}`}>{statuses[property.status]}</span>
        </Link>
        <div className="card-content">
            <div className="card-meta"><span>{propertyTypes[property.property_type] ?? property.property_type}</span><span>#{property.id}</span></div>
            <p className="price">{money.format(Number(property.sale_price))}</p>
            <h3>{property.title}</h3>
            <p className="muted text-sm">{visitStatus(property.status, property.active_reservation)}</p>
            <p className="muted text-sm">{locationLabel(property) || 'Localização não informada'}</p>
            <div className="card-meta">
                {(property.bedrooms ?? 0) > 0 && <span><i className="fa-solid fa-bed" aria-hidden="true" /> {property.bedrooms} quartos</span>}
                {(property.bathrooms ?? 0) > 0 && <span><i className="fa-solid fa-bath" aria-hidden="true" /> {property.bathrooms} banh.</span>}
                {(property.garage_spots ?? 0) > 0 && <span><i className="fa-solid fa-car" aria-hidden="true" /> {property.garage_spots} vagas</span>}
                {Number(property.built_area || property.land_area) > 0 && <span>{Number(property.built_area || property.land_area).toLocaleString('pt-BR')} m²</span>}
            </div>
        </div>
        <PropertyActions property={property} notify={notify} />
    </article>;
}
