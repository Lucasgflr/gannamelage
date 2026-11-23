export default function SortSelect({ sort, change }: { sort: string; change: (value: string) => void }) {
    return <label className="sort-select">
        <span className="sr-only">Ordenação</span>
        <select value={sort} onChange={event => change(event.target.value)}>
            <option value="">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="price_asc">Menor preço</option>
            <option value="price_desc">Maior preço</option>
            <option value="title">Título A–Z</option>
        </select>
    </label>;
}
