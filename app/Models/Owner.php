<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Representa o proprietário do imóvel (a pessoa que está vendendo).
 *
 * Corresponde à tabela "owners". Foi separado do usuário de login de
 * propósito: o dono do imóvel não entra no sistema. A equipe só guarda
 * nome, telefone e e-mail para contato.
 *
 * Um proprietário pode estar ligado a vários imóveis (relação hasMany),
 * embora na prática o cadastro atual cria um registro novo de owner
 * para cada imóvel, em vez de reaproveitar o mesmo dono.
 */
class Owner extends Model
{
    use HasFactory;

    /**
     * Campos liberados para gravação em massa.
     * São exatamente os três dados pedidos na aba "Proprietário" do formulário.
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
    ];

    /**
     * Lista os imóveis deste proprietário.
     * No banco, a ligação é a coluna properties.owner_id.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }
}
