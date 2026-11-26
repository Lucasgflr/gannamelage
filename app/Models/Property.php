<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Representa um imóvel à venda. É o registro central do sistema.
 *
 * Corresponde à tabela "properties". Cada linha guarda tipo, áreas,
 * preços, cômodos, endereço, situação (status) e um slug.
 *
 * O slug é o trecho amigável da URL pública, por exemplo
 * "casa-no-centro-64f1a2". A landing page abre em /p/{slug}.
 *
 * Status possíveis (coluna enum):
 *   draft     — rascunho; não aparece na página pública
 *   available — disponível para venda e visível na landing
 *   reserved  — reservado
 *   sold      — vendido (a "baixa" feita pelo botão Vender)
 *
 * Ligações:
 *   owner()  — o proprietário (tabela owners), opcional
 *   photos() — as fotos (tabela property_photos)
 *   user()   — o usuário interno que cadastrou (tabela users)
 */
class Property extends Model
{
    use HasFactory;

    /**
     * Campos que o controller pode gravar de uma vez.
     */
    protected $fillable = [
        'title',
        'title_automatic',
        'title_suffix',
        'description',
        'property_type',
        'land_area',
        'built_area',
        'sale_price',
        'condo_price',
        'iptu',
        'bedrooms',
        'suites',
        'bathrooms',
        'garage_spots',
        'status',
        'slug',
        'address_street',
        'address_number',
        'address_complement',
        'address_neighborhood',
        'address_city',
        'address_state',
        'address_zip',
        'owner_id',
        'user_id',
    ];

    /**
     * Garante que preços e áreas saiam com duas casas decimais
     * (ex.: "450000.00"), e não como texto solto.
     */
    protected $casts = [
        'title_automatic' => 'boolean',
        'sale_price' => 'decimal:2',
        'condo_price' => 'decimal:2',
        'iptu' => 'decimal:2',
        'land_area' => 'decimal:2',
        'built_area' => 'decimal:2',
    ];

    /**
     * O proprietário deste imóvel.
     * owner_id pode ser nulo: dá para cadastrar o imóvel sem dono.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(Owner::class);
    }

    /**
     * Todas as fotos deste imóvel, na ordem em que foram gravadas.
     * Se o imóvel for apagado, o banco apaga as fotos em cascata
     * (a migration usa cascadeOnDelete). Os arquivos em disco são
     * apagados à parte, no método destroy do PropertyController.
     */
    public function photos(): HasMany
    {
        return $this->hasMany(PropertyPhoto::class);
    }

    /**
     * Usuário interno que cadastrou o imóvel (quem estava logado no store).
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reservations(): HasMany
    {
        return $this->hasMany(PropertyReservation::class);
    }

    public function activeReservation(): HasOne
    {
        return $this->hasOne(PropertyReservation::class)->active();
    }

    public function endVisitReservation(int $userId, string $reason): void
    {
        $this->reservations()->active()->update([
            'released_at' => now('UTC'),
            'released_by' => $userId,
            'release_reason' => $reason,
        ]);
    }

    /**
     * Devolve a foto marcada como principal (is_main = true).
     * Se nenhuma estiver marcada, devolve null. As telas, nesse caso,
     * usam a primeira foto da lista como reserva.
     */
    public function mainPhoto(): ?PropertyPhoto
    {
        return $this->photos()->where('is_main', true)->first();
    }

    /**
     * Atalho de consulta: Property::available() traz só os disponíveis.
     * Hoje a listagem usa byStatus(); este escopo fica disponível para
     * outras consultas que precisem só do status "available".
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Atalho de consulta usado pela listagem do painel.
     * Ex.: Property::byStatus('sold') equivale a filtrar status = sold.
     * O controller chama isso quando a tela manda o parâmetro ?status=.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }
}
