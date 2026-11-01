<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Cuida do login e do logout dos usuários internos (corretores/equipe).
 *
 * Foi criado porque as telas Vue não usam sessão clássica de formulário:
 * o navegador pede um token (uma senha temporária de acesso) e o envia
 * em cada chamada da API. O pacote que gera e guarda esse token é o Sanctum.
 *
 * Rotas (arquivo routes/api.php), todas com prefixo /api:
 *   POST /api/login   — pública, não exige token
 *   POST /api/logout  — exige token
 *   GET  /api/user    — exige token; devolve quem está logado
 */
class AuthController extends Controller
{
    /**
     * Confere e-mail e senha e, se estiverem certos, devolve um token.
     *
     * Passo a passo:
     * 1. Exige e-mail válido e senha preenchida. Se faltar algo, o Laravel
     *    responde 422 (dados inválidos) automaticamente.
     * 2. Procura o usuário pelo e-mail na tabela users.
     * 3. Compara a senha digitada com o hash gravado no banco. A senha nunca
     *    fica em texto puro: Hash::check faz essa comparação com segurança.
     * 4. Se o usuário não existe ou a senha não bate, devolve erro no campo
     *    e-mail, sem dizer qual dos dois está errado (isso evita que alguém
     *    descubra quais e-mails estão cadastrados).
     * 5. Se estiver tudo certo, cria um token chamado "api" e devolve o token
     *    junto com os dados do usuário. A senha não vai na resposta porque
     *    o model User a esconde (campo $hidden).
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais fornecidas estão incorretas.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }

    /**
     * Encerra o acesso atual apagando só o token que está sendo usado.
     *
     * O usuário precisa estar autenticado (middleware auth:sanctum).
     * Outros tokens desse mesmo usuário, se existirem, continuam válidos.
     * A tela de login chama esta rota ao clicar em Sair.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Desconectado com sucesso.']);
    }

    /**
     * Devolve os dados de quem está logado (nome, e-mail, id).
     *
     * A tela usa isso ao abrir o sistema: se o token guardado no navegador
     * ainda for válido, o nome do usuário aparece no painel. Se o token
     * tiver sido apagado, o Sanctum responde 401 e o frontend desloga.
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
