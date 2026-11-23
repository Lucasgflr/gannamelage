import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, errorMessage } from '../services/api';
import { publicUrl } from '../services/share';
import type { Property } from '../types/property';
import ShareButton from './ShareButton';
import Sheet from './Sheet';

const labels = { publish: 'Publicar', sell: 'Vender', duplicate: 'Duplicar', delete: 'Excluir' } as const;
type Action = keyof typeof labels;

export default function PropertyActions({ property, notify }: { property: Property; notify: (message: string) => void }) {
    const [menu, setMenu] = useState(false);
    const [confirm, setConfirm] = useState<Action>();
    const client = useQueryClient();
    const endpoint = `/api/properties/${property.id}`;
    const mutation = useMutation({
        mutationFn: async (action: Action) => {
            switch (action) {
                case 'publish': await api.put(endpoint, { status: 'available' }); break;
                case 'sell': await api.post(`${endpoint}/sell`); break;
                case 'duplicate': await api.post(`${endpoint}/duplicate`); break;
                case 'delete': await api.delete(endpoint); break;
            }
        },
        onSuccess: async (_, action) => {
            setMenu(false);
            setConfirm(undefined);
            notify({
                publish: 'Imóvel publicado.', sell: 'Imóvel marcado como vendido.',
                duplicate: 'Imóvel duplicado como rascunho.', delete: 'Imóvel excluído.',
            }[action]);
            await Promise.all([
                client.invalidateQueries({ queryKey: ['properties'] }),
                client.invalidateQueries({ queryKey: ['property', String(property.id)] }),
                client.invalidateQueries({ queryKey: ['public-property', property.slug] }),
            ]);
        },
    });
    const options: Action[] = [];
    if (property.status === 'draft') options.push('publish');
    if (property.status === 'available' || property.status === 'reserved') options.push('sell');
    options.push('duplicate', 'delete');
    const url = publicUrl(property);
    const view = `/properties/${property.id}/view`;

    return <div className="card-actions">
        <ShareButton property={property} />
        <Link className="btn" to={`/properties/${property.id}/edit`}>Editar</Link>
        <button className="btn" type="button" aria-label="Mais opções" aria-haspopup="dialog"
            onClick={() => { mutation.reset(); setMenu(true); }}>
            <i className="fa-solid fa-ellipsis" aria-hidden="true" />
        </button>
        {menu && <Sheet title={confirm ? `${labels[confirm]} imóvel?` : 'Mais opções'} close={() => {
            if (mutation.isPending) return;
            setMenu(false);
            setConfirm(undefined);
        }}>
            {confirm ? <>
                <p>{confirm === 'delete' ? `“${property.title}” e suas fotos serão excluídos permanentemente.` : property.title}</p>
                <button className={`btn ${confirm === 'delete' ? 'danger' : 'primary'}`} disabled={mutation.isPending}
                    onClick={() => mutation.mutate(confirm)}>Confirmar {labels[confirm].toLocaleLowerCase('pt-BR')}</button>
                <button className="btn" disabled={mutation.isPending}
                    onClick={() => { mutation.reset(); setConfirm(undefined); }}>Cancelar</button>
            </> : <>
                <Link className="btn" to={view}>Visualizar</Link>
                {url && <a className="btn" href={url}>Ver página pública</a>}
                {options.map(action => <button key={action} className={`btn ${action === 'delete' ? 'danger' : ''}`}
                    onClick={() => { mutation.reset(); setConfirm(action); }}>{labels[action]}</button>)}
            </>}
            {mutation.isError && <p role="alert">{errorMessage(mutation.error, 'Não foi possível concluir a operação. Tente novamente.')}</p>}
        </Sheet>}
    </div>;
}
