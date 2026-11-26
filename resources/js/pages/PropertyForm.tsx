import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useProperty } from '../hooks/useProperty';
import { api, errorMessage } from '../services/api';
import { publicUrl } from '../services/share';
import { coverPhoto, money, photoUrl, propertyTypes, statuses, type Photo, type Property } from '../types/property';
import ShareButton from '../components/ShareButton';
import Sheet from '../components/Sheet';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { useLocationOptions } from '../hooks/useLocationOptions';
import municipalities from '../utils/municipalities.json';
import { cleanLocation, searchLocationKey } from '../utils/location';
import { propertyTitle } from '../utils/propertyTitle';
import PriceThousandsField from '../components/PriceThousandsField';
import { parsePriceThousands, reaisToThousands } from '../utils/price';

const tabs = ['Imóvel', 'Proprietário', 'Fotos', 'Link'] as const;
const address = [
    ['address_street', 'Rua', 255], ['address_number', 'Número', 20],
    ['address_complement', 'Complemento', 255], ['address_zip', 'CEP', 10],
] as const;
const numbers = [
    ['condo_price', 'Condomínio', '0.01'],
    ['iptu', 'IPTU anual', '0.01'], ['land_area', 'Área do terreno (m²)', '0.01'],
    ['built_area', 'Área construída (m²)', '0.01'], ['bedrooms', 'Quartos', '1'],
    ['suites', 'Suítes', '1'], ['bathrooms', 'Banheiros', '1'], ['garage_spots', 'Vagas', '1'],
] as const;

interface LocalPhoto { file: File; preview: string }

function Editor({ property }: { property?: Property }) {
    const navigate = useNavigate();
    const client = useQueryClient();
    const [saved, setSaved] = useState(property);
    const [tab, setTab] = useState<(typeof tabs)[number]>('Imóvel');
    const [manualTitle, setManualTitle] = useState(property?.title ?? '');
    const [automatic, setAutomatic] = useState(property ? Boolean(property.title_automatic) : true);
    const [suffix, setSuffix] = useState(property?.title_suffix ?? '');
    const [state, setState] = useState(property ? property.address_state ?? '' : 'MG');
    const [city, setCity] = useState(property ? property.address_city ?? '' : 'São Lourenço');
    const [neighborhood, setNeighborhood] = useState(property?.address_neighborhood ?? '');
    const locations = useLocationOptions(true).data?.states ?? [];
    const registered = locations.find(option => option.uf === state)?.cities ?? [];
    const neighborhoods = registered.find(option => searchLocationKey(option.name) === searchLocationKey(city))?.neighborhoods ?? [];
    const reference = municipalities as Record<string, { name: string; cities: string[] }>;
    const registeredKeys = new Set(registered.map(option => searchLocationKey(option.name)));
    const cities = [
        ...registered.map(option => option.name),
        ...(reference[state]?.cities ?? []).filter(name => !registeredKeys.has(searchLocationKey(name))),
    ];
    const [type, setType] = useState(property?.property_type ?? 'casa');
    const neighborhoodName = neighborhoods.find(name => searchLocationKey(name) === searchLocationKey(neighborhood))
        ?? cleanLocation(neighborhood);
    const title = automatic ? propertyTitle(type, state, city, neighborhoodName, suffix) : manualTitle;
    const [price, setPrice] = useState(reaisToThousands(property?.sale_price));
    const salePrice = parsePriceThousands(price);
    const [photos, setPhotos] = useState(property?.photos ?? []);
    const [main, setMain] = useState<LocalPhoto>();
    const [gallery, setGallery] = useState<LocalPhoto[]>([]);
    const [remove, setRemove] = useState<Photo>();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const previews = useRef(new Set<string>());
    const savedId = useRef(property?.id);

    useEffect(() => {
        const urls = previews.current;
        return () => urls.forEach(url => URL.revokeObjectURL(url));
    }, []);

    function preview(file: File) {
        const url = URL.createObjectURL(file);
        previews.current.add(url);
        return { file, preview: url };
    }

    function release(photo?: LocalPhoto) {
        if (photo && previews.current.delete(photo.preview)) URL.revokeObjectURL(photo.preview);
    }

    async function upload(id: number, files: LocalPhoto[], isMain: boolean) {
        const data = new FormData();
        files.forEach(({ file }) => data.append('photos[]', file));
        if (isMain) data.append('is_main', '1');
        const response = await api.post<Photo[]>(`/api/properties/${id}/photos`, data);
        setPhotos(current => [
            ...current.map(photo => isMain ? { ...photo, is_main: false } : photo),
            ...response.data,
        ]);
        files.forEach(release);
    }

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (busy) return;
        const fields = new FormData(event.currentTarget);
        if (!title.trim() || title.trim().length > 255 || salePrice === null || Number(salePrice) <= 0) {
            setTab('Imóvel');
            setError(!title.trim() || title.trim().length > 255
                ? 'Informe um título de até 255 caracteres.'
                : 'Informe um valor de venda válido em R$ mil, maior que zero.');
            return;
        }
        const data = {
            title: title.trim(), title_automatic: automatic, title_suffix: automatic ? suffix.trim() : null,
            address_state: state || null, address_city: city || null,
            address_neighborhood: neighborhoodName || null,
            sale_price: salePrice, property_type: type, description: fields.get('description'),
            ...Object.fromEntries(address.map(([key]) => [key, String(fields.get(key) ?? '').trim() || null])),
            ...Object.fromEntries(numbers.map(([key, , step]) => {
                const value = fields.get(key);
                return [key, value ? Number(value) : key === 'condo_price' || step === '1' ? 0 : null];
            })),
            owner: { name: fields.get('name'), phone: fields.get('phone'), email: fields.get('email') },
        };
        setBusy(true);
        setError('');
        try {
            const response = savedId.current
                ? await api.put<Property>(`/api/properties/${savedId.current}`, data)
                : await api.post<Property>('/api/properties', { ...data, status: 'draft' });
            const persisted = response.data;
            savedId.current = persisted.id;
            setSaved(persisted);
            setPhotos(persisted.photos);
            if (main) {
                await upload(persisted.id, [main], true);
                setMain(undefined);
            }
            if (gallery.length) {
                await upload(persisted.id, gallery, false);
                setGallery([]);
            }
            navigate('/');
        } catch (failure) {
            setError(errorMessage(failure, savedId.current
                ? 'Não foi possível concluir. Tente salvar novamente para atualizar o mesmo imóvel.'
                : 'Não foi possível salvar o imóvel.'));
        } finally {
            await Promise.all([
                client.invalidateQueries({ queryKey: ['properties'] }),
                client.invalidateQueries({ queryKey: ['property', String(savedId.current)] }),
                client.invalidateQueries({ queryKey: ['public-property'] }),
                client.invalidateQueries({ queryKey: ['property-internal'] }),
            ]);
            setBusy(false);
        }
    }

    async function deletePhoto(photo: Photo) {
        setBusy(true);
        setError('');
        try {
            await api.delete(`/api/properties/${savedId.current}/photos/${photo.id}`);
            setPhotos(current => current.filter(item => item.id !== photo.id));
            await Promise.all([
                client.invalidateQueries({ queryKey: ['properties'] }),
                client.invalidateQueries({ queryKey: ['property', String(savedId.current)] }),
                client.invalidateQueries({ queryKey: ['public-property'] }),
                client.invalidateQueries({ queryKey: ['property-internal'] }),
            ]);
        } catch (failure) {
            setError(errorMessage(failure, 'Não foi possível remover a foto.'));
        } finally {
            setRemove(undefined);
            setBusy(false);
        }
    }

    const cover = coverPhoto({ photos });
    const image = main?.preview ?? (cover && photoUrl(cover));
    const url = saved ? publicUrl(saved) : null;

    return <section className="stack">
        <div className="row wrap"><Link className="btn" to="/">Voltar</Link><h1>{property ? 'Editar imóvel' : 'Novo imóvel'}</h1></div>
        <div className="editor-grid">
            <form className="panel stack" onSubmit={submit} noValidate>
                <div className="row wrap tab-row" aria-label="Seções do cadastro">
                    {tabs.map(label => <button type="button" className="btn" aria-pressed={label === tab} key={label} onClick={() => setTab(label)}>{label}</button>)}
                </div>
                <fieldset className="stack" hidden={tab !== 'Imóvel'} disabled={busy}>
                    <label>Tipo do imóvel<select value={type} onChange={event => setType(event.target.value)}>
                        {!Object.hasOwn(propertyTypes, type) && <option value={type}>{type}</option>}
                        {Object.entries(propertyTypes).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                    </select></label>
                    <div className="location-fields">
                        <LocationAutocomplete label="Estado" value={state} options={Object.entries(reference).map(([uf, item]) => ({ value: uf, label: `${uf} — ${item.name}` }))}
                            change={value => { if (value !== state) { setState(value); setCity(''); setNeighborhood(''); } }} />
                        <LocationAutocomplete label="Cidade" value={city} options={cities.map(value => ({ value }))} disabled={!state}
                            change={value => { if (value !== city) { setCity(value); setNeighborhood(''); } }} />
                        <LocationAutocomplete label="Bairro" value={neighborhood} options={neighborhoods.map(value => ({ value }))}
                            disabled={!city} custom change={setNeighborhood} />
                    </div>
                    {automatic ? <>
                        <label>Complemento do título<input value={suffix} onChange={event => setSuffix(event.target.value)} maxLength={255} /></label>
                        <p><strong>Título do imóvel</strong> {title}</p>
                        <button className="btn" type="button" onClick={() => { setManualTitle(title); setAutomatic(false); }}>Editar título manualmente</button>
                    </> : <>
                        <label>Título do imóvel<input value={manualTitle} onChange={event => setManualTitle(event.target.value)} maxLength={255} /></label>
                        <button className="btn" type="button" onClick={() => setAutomatic(true)}>Gerar título automático</button>
                    </>}
                    <label>Descrição<textarea name="description" rows={4} defaultValue={property?.description ?? ''} /></label>
                    <div className="field-grid">
                        <PriceThousandsField label="Valor de venda" value={price} change={setPrice} required />
                        {numbers.map(([key, label, step]) => <label key={key}>{label}
                            <input name={key} type="number" min="0" step={step} defaultValue={property?.[key] ?? ''} />
                        </label>)}
                    </div>
                    <h2>Endereço</h2>
                    <div className="field-grid">{address.map(([key, label, max]) => <label key={key}>{label}
                        <input name={key} maxLength={max} defaultValue={property?.[key] ?? ''} />
                    </label>)}</div>
                </fieldset>
                <fieldset className="stack" hidden={tab !== 'Proprietário'} disabled={busy}>
                    <label>Nome<input name="name" defaultValue={property?.owner?.name ?? ''} maxLength={255} /></label>
                    <label>Telefone<input name="phone" type="tel" defaultValue={property?.owner?.phone ?? ''} maxLength={20} /></label>
                    <label>E-mail<input name="email" type="email" defaultValue={property?.owner?.email ?? ''} maxLength={255} /></label>
                </fieldset>
                <fieldset className="stack" hidden={tab !== 'Fotos'} disabled={busy}>
                    <label>Foto principal<input type="file" accept="image/*" onChange={event => {
                        const file = event.currentTarget.files?.[0];
                        if (file) {
                            release(main);
                            setMain(preview(file));
                        }
                        event.currentTarget.value = '';
                    }} /></label>
                    {main && <button type="button" className="btn" onClick={() => { release(main); setMain(undefined); }}>Cancelar nova capa</button>}
                    <label>Fotos da galeria<input type="file" accept="image/*" multiple onChange={event => {
                        const selected = Array.from(event.currentTarget.files ?? [], preview);
                        setGallery(current => [...current, ...selected]);
                        event.currentTarget.value = '';
                    }} /></label>
                    <div className="photo-grid">
                        {photos.map(photo => <div key={photo.id}>
                            <img src={photoUrl(photo)} alt={photo.is_main ? 'Capa salva' : 'Foto salva'} />
                            <button type="button" className="btn" onClick={() => setRemove(photo)}>Remover</button>
                        </div>)}
                        {gallery.map(photo => <div key={photo.preview}>
                            <img src={photo.preview} alt="Foto a enviar" />
                            <button type="button" className="btn" onClick={() => {
                                release(photo);
                                setGallery(current => current.filter(item => item !== photo));
                            }}>Retirar</button>
                        </div>)}
                    </div>
                </fieldset>
                <div className="stack" hidden={tab !== 'Link'}>
                    {saved && url ? <>
                        <label>Link público<input readOnly value={url} onFocus={event => event.currentTarget.select()} /></label>
                        <div className="row wrap"><a className="btn" href={url}>Ver página pública</a><ShareButton property={saved} /></div>
                    </> : <p>O link público ficará disponível depois da publicação no painel.</p>}
                </div>
                {error && <p role="alert">{error}</p>}
                <div className="row wrap"><Link className="btn" to="/">Cancelar</Link>
                    <button className="btn primary" disabled={busy}>{busy ? 'Processando…' : 'Salvar imóvel'}</button>
                </div>
            </form>
            <aside className="panel stack preview">
                <h2>Prévia do imóvel</h2>
                {image && <img src={image} alt="Prévia da capa" />}
                <span className={`status ${saved?.status ?? 'draft'}`}>{statuses[saved?.status ?? 'draft']}</span>
                <strong>{title || 'Título do imóvel'}</strong><p>{money.format(Number(salePrice))}</p>
            </aside>
        </div>
        {remove && <Sheet title="Remover foto?" close={() => { if (!busy) setRemove(undefined); }}>
            <p>Esta foto será excluída permanentemente.</p>
            <button className="btn danger" disabled={busy} onClick={() => void deletePhoto(remove)}>Confirmar remoção</button>
        </Sheet>}
    </section>;
}

export default function PropertyForm({ id }: { id?: string }) {
    const query = useProperty(id);
    if (!id) return <Editor />;
    if (query.isPending) return <p role="status">Carregando imóvel…</p>;
    if (!query.data) return <div className="stack"><p role="alert">Não foi possível carregar o imóvel.</p>
        <div className="row wrap"><Link className="btn" to="/">Voltar</Link>
            <button className="btn" onClick={() => void query.refetch()}>Tentar novamente</button>
        </div>
    </div>;
    return <Editor property={query.data} />;
}
