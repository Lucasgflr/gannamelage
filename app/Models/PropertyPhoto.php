<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Representa uma foto de um imóvel.
 *
 * Corresponde à tabela "property_photos". O arquivo em si não fica no
 * banco: fica no disco, em storage/app/public/properties/{id-do-imovel}/.
 * Aqui só guardamos o caminho relativo (coluna path), se a foto é a
 * principal e a ordem de exibição.
 *
 * A URL pública da foto é /storage/{path}, porque o Laravel publica
 * a pasta storage/app/public pelo link simbólico "public/storage".
 */
class PropertyPhoto extends Model
{
    use HasFactory;

    /**
     * Campos liberados para gravação.
     * property_id liga a foto ao imóvel.
     * path é o caminho relativo no disco public.
     * is_main indica a foto de capa (só uma deveria ser true por imóvel).
     * order é a posição na galeria; o upload preenche com a quantidade atual.
     */
    protected $fillable = [
        'property_id',
        'path',
        'is_main',
        'order',
    ];

    /**
     * is_main chega do banco como 0/1 e sai para o Vue como true/false.
     */
    protected $casts = [
        'is_main' => 'boolean',
    ];

    /**
     * O imóvel ao qual esta foto pertence.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }
}
