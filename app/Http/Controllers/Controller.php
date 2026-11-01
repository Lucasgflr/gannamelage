<?php

namespace App\Http\Controllers;

/**
 * Classe base de todos os controllers deste sistema.
 *
 * No Laravel, o controller é a peça que recebe o pedido vindo do navegador
 * (feito pelas telas Vue) e decide o que fazer: conferir os dados, falar com
 * o banco por meio dos models e devolver uma resposta em JSON.
 *
 * Esta classe não tem métodos próprios. Ela existe para que AuthController e
 * PropertyController herdem o comportamento padrão do framework (por exemplo,
 * receber a requisição e aplicar os middlewares). "Abstract" significa que
 * ninguém instancia esta classe direto: só as classes filhas são usadas.
 */
abstract class Controller
{
    //
}
