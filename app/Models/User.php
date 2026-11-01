<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Representa uma pessoa que entra no sistema (corretor ou equipe interna).
 *
 * Corresponde à tabela "users". Não é o dono do imóvel: o dono fica na
 * tabela "owners". Este cadastro só serve para login.
 *
 * Herda de Authenticatable, a classe do Laravel feita para login.
 * Traits usados:
 *   HasApiTokens — permite criar e revogar os tokens do Sanctum (login da API)
 *   HasFactory   — permite criar usuários de teste
 *   Notifiable   — permite enviar notificações (não é usado hoje nas telas)
 */
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Campos que podem ser gravados de uma vez (mass assignment).
     * Qualquer outro campo enviado num create/update é ignorado.
     * A senha entra aqui, mas o cast "hashed" abaixo a transforma em hash
     * antes de gravar, então o banco nunca guarda a senha em texto puro.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * Campos que NÃO podem sair quando o usuário é convertido em JSON.
     * Por isso o login devolve o usuário sem a senha e sem o remember_token.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Converte tipos ao ler e ao gravar.
     * email_verified_at vira data/hora do PHP.
     * password é hasheada automaticamente sempre que for atribuída.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
}
