<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Property;
use App\Models\PropertyPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Cuida de tudo que acontece com um imóvel: listar, criar, editar,
 * apagar, duplicar, vender, enviar fotos e montar a página pública.
 *
 * Foi criado para ser a API que o Vue consome. Quase todas as rotas
 * exigem login (middleware auth:sanctum em routes/api.php). A única
 * exceção é showPublic, usada pela landing page que o cliente abre
 * sem senha.
 *
 * As fotos recebem uma marca d'água ("GANNAM & LAGE - VENDAS") desenhada
 * com a biblioteca GD do PHP, no momento do upload. O comando de console
 * watermark:reprocess reaplica essa marca nas fotos que já existem.
 */
class PropertyController extends Controller
{
    /**
     * Lista os imóveis do painel, com filtros e busca em texto livre.
     *
     * Sempre devolve proprietário e fotos juntos (with owner e photos),
     * para o card da tela não precisar de uma segunda requisição.
     *
     * A busca do campo "search" é interpretada em etapas. Cada etapa
     * reconhece um pedaço da frase, aplica o filtro e apaga esse pedaço
     * do texto. O que sobrar vira busca por título, descrição, endereço
     * ou nome do proprietário.
     *
     * Exemplos que a busca entende:
     *   "casa"                         — tipo de imóvel
     *   "400000-800000" ou "400k-800k" — faixa de preço de venda
     *   "a partir de 400k"             — preço mínimo
     *   "até 800000"                   — preço máximo
     *   "iptu 500" ou "iptu até 1000"  — IPTU exato ou teto
     *   "cond 300"                     — condomínio
     *   "3 quartos", "2 suites"        — cômodos (mínimo, não exato)
     *
     * Além do texto, a tela de filtros manda parâmetros separados
     * (property_type, min_price, bedrooms, address_city, etc.).
     * Esses filtros se somam à busca, não a substituem.
     *
     * A resposta é paginada. per_page só aceita 5, 10, 15, 20, 25, 30,
     * 50 ou 100. Qualquer outro valor cai para 25. A ordem é do mais
     * recente para o mais antigo (latest).
     */
    public function index(Request $request)
    {
        $query = Property::with(['owner', 'photos']);

        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        $textSearch = null;
        if ($request->filled('search')) {
            $rawSearch = trim($request->search);
            $searchLower = mb_strtolower($rawSearch);

            // Procura um tipo conhecido dentro da frase (casa, lote, terreno...).
            // O primeiro que aparecer vira filtro de property_type e sai do texto.
            $tipos = ['casa', 'apartamento', 'lote', 'galpão', 'galpao', 'chácara', 'chacara', 'sítio', 'sitio', 'terreno', 'sala comercial', 'salão', 'salao', 'kitnet', 'loft', 'cobertura', 'duplex', 'triplex'];
            foreach ($tipos as $tipo) {
                if (str_contains($searchLower, $tipo)) {
                    $query->where('property_type', 'like', "%{$tipo}%");
                    $rawSearch = preg_replace('/\b' . preg_quote($tipo, '/') . '\b/iu', '', $rawSearch);
                    $searchLower = mb_strtolower(trim($rawSearch));
                    break;
                }
            }

            // Faixa de preço: "400000-800000", "400k-800k" ou "400.000 - 800.000".
            // O "k", "mil" ou "m" multiplica o número por 1000 (ver parseMoney).
            if (preg_match('/(\d[\d\.\s]*)(k|mil|m)?\s*[-–]\s*(\d[\d\.\s]*)(k|mil|m)?/iu', $rawSearch, $m)) {
                $min = $this->parseMoney($m[1], $m[2] ?? '');
                $max = $this->parseMoney($m[3], $m[4] ?? '');
                $query->whereBetween('sale_price', [$min, $max]);
                $rawSearch = preg_replace('/\d[\d\.\s]*(?:k|mil|m)?\s*[-–]\s*\d[\d\.\s]*(?:k|mil|m)?/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }
            // Preço mínimo, só se não houve faixa. Ex.: "a partir de 400k", "acima de 500000".
            elseif (preg_match('/(?:a\s*partir\s*de|acima\s*de|min|maior\s*que|maiores?\s*que|>+)\s*(\d[\d\.\s]*)(k|mil|m)?/iu', $rawSearch, $m)) {
                $min = $this->parseMoney($m[1], $m[2] ?? '');
                $query->where('sale_price', '>=', $min);
                $rawSearch = preg_replace('/(?:a\s*partir\s*de|acima\s*de|min|maior\s*que|maiores?\s*que|>+)\s*\d[\d\.\s]*(?:k|mil|m)?/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }
            // Preço máximo, só se não houve faixa nem mínimo. Ex.: "até 800000", "abaixo de 500k".
            elseif (preg_match('/(?:até|ate|abaixo\s*de|max|menor\s*que|menores?\s*que|<)\s*(\d[\d\.\s]*)(k|mil|m)?/iu', $rawSearch, $m)) {
                $max = $this->parseMoney($m[1], $m[2] ?? '');
                $query->where('sale_price', '<=', $max);
                $rawSearch = preg_replace('/(?:até|ate|abaixo\s*de|max|menor\s*que|menores?\s*que|<)\s*\d[\d\.\s]*(?:k|mil|m)?/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }

            // IPTU. "iptu 500" filtra o valor exato. "iptu até 1000" filtra o teto.
            if (preg_match('/iptu[:\s]*(até|ate|ate)?[:\s]*(\d[\d\.\s]*)/iu', $rawSearch, $m)) {
                $iptu = (float) str_replace(['.', ' ', ','], ['', '', '.'], $m[2]);
                if (!empty($m[1])) {
                    $query->where('iptu', '<=', $iptu);
                } else {
                    $query->where('iptu', $iptu);
                }
                $rawSearch = preg_replace('/iptu[:\s]*(?:até|ate|ate)?[:\s]*\d[\d\.\s]*/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }

            // Condomínio. Aceita "cond", "condo" ou "condominio", com ou sem "até".
            if (preg_match('/cond(?:omínio|ominio|o)?[:\s]*(até|ate|ate)?[:\s]*(\d[\d\.\s]*)/iu', $rawSearch, $m)) {
                $condo = (float) str_replace(['.', ' ', ','], ['', '', '.'], $m[2]);
                if (!empty($m[1])) {
                    $query->where('condo_price', '<=', $condo);
                } else {
                    $query->where('condo_price', $condo);
                }
                $rawSearch = preg_replace('/cond(?:omínio|ominio|o)?[:\s]*(?:até|ate|ate)?[:\s]*\d[\d\.\s]*/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }

            // Cômodos. O número é tratado como mínimo (3 quartos = 3 ou mais).
            // A palavra decide a coluna: quarto/dormitório, suíte, banheiro ou garagem/vaga.
            if (preg_match('/(\d+)\s*(quartos?|q|dormitórios?|dormitorios?|suítes?|suites?|banheiros?|garagens?|vagas?)/iu', $rawSearch, $m)) {
                $num = (int) $m[1];
                $word = mb_strtolower($m[2]);
                if (str_contains($word, 'quarto') || str_contains($word, 'q') || str_contains($word, 'dormit')) {
                    $query->where('bedrooms', '>=', $num);
                } elseif (str_contains($word, 'suít') || str_contains($word, 'suit')) {
                    $query->where('suites', '>=', $num);
                } elseif (str_contains($word, 'banheiro')) {
                    $query->where('bathrooms', '>=', $num);
                } elseif (str_contains($word, 'garag') || str_contains($word, 'vaga')) {
                    $query->where('garage_spots', '>=', $num);
                }
                $rawSearch = preg_replace('/\d+\s*(quartos?|q|dormitórios?|dormitorios?|suítes?|suites?|banheiros?|garagens?|vagas?)/iu', '', $rawSearch, 1);
                $searchLower = mb_strtolower(trim($rawSearch));
            }

            $textSearch = trim($rawSearch);

            // O que sobrou da frase é procurado em título, descrição, endereço
            // e no nome do proprietário. Qualquer um desses campos basta.
            if (!empty($textSearch)) {
                $query->where(function ($q) use ($textSearch) {
                    $q->where('title', 'like', "%{$textSearch}%")
                      ->orWhere('description', 'like', "%{$textSearch}%")
                      ->orWhere('address_street', 'like', "%{$textSearch}%")
                      ->orWhere('address_neighborhood', 'like', "%{$textSearch}%")
                      ->orWhere('address_city', 'like', "%{$textSearch}%")
                      ->orWhere('address_state', 'like', "%{$textSearch}%")
                      ->orWhereHas('owner', function ($ownerQuery) use ($textSearch) {
                          $ownerQuery->where('name', 'like', "%{$textSearch}%");
                      });
                });
            }
        }

        if ($request->filled('property_type')) {
            $query->where('property_type', $request->property_type);
        }

        if ($request->filled('bedrooms')) {
            $query->where('bedrooms', '>=', $request->bedrooms);
        }

        if ($request->filled('suites')) {
            $query->where('suites', '>=', $request->suites);
        }

        if ($request->filled('bathrooms')) {
            $query->where('bathrooms', '>=', $request->bathrooms);
        }

        if ($request->filled('garage_spots')) {
            $query->where('garage_spots', '>=', $request->garage_spots);
        }

        $query->where(function ($q) use ($request) {
            if ($request->filled('min_price') && $request->filled('max_price')) {
                $q->whereBetween('sale_price', [$request->min_price, $request->max_price]);
            } elseif ($request->filled('min_price')) {
                $q->where('sale_price', '>=', $request->min_price);
            } elseif ($request->filled('max_price')) {
                $q->where('sale_price', '<=', $request->max_price);
            }
        });

        $query->where(function ($q) use ($request) {
            if ($request->filled('min_condo_price') && $request->filled('max_condo_price')) {
                $q->whereBetween('condo_price', [$request->min_condo_price, $request->max_condo_price]);
            } elseif ($request->filled('min_condo_price')) {
                $q->where('condo_price', '>=', $request->min_condo_price);
            } elseif ($request->filled('max_condo_price')) {
                $q->where('condo_price', '<=', $request->max_condo_price);
            }
        });

        $query->where(function ($q) use ($request) {
            if ($request->filled('min_iptu') && $request->filled('max_iptu')) {
                $q->whereBetween('iptu', [$request->min_iptu, $request->max_iptu]);
            } elseif ($request->filled('min_iptu')) {
                $q->where('iptu', '>=', $request->min_iptu);
            } elseif ($request->filled('max_iptu')) {
                $q->where('iptu', '<=', $request->max_iptu);
            }
        });

        $query->where(function ($q) use ($request) {
            if ($request->filled('min_land_area') && $request->filled('max_land_area')) {
                $q->whereBetween('land_area', [$request->min_land_area, $request->max_land_area]);
            } elseif ($request->filled('min_land_area')) {
                $q->where('land_area', '>=', $request->min_land_area);
            } elseif ($request->filled('max_land_area')) {
                $q->where('land_area', '<=', $request->max_land_area);
            }
        });

        $query->where(function ($q) use ($request) {
            if ($request->filled('min_built_area') && $request->filled('max_built_area')) {
                $q->whereBetween('built_area', [$request->min_built_area, $request->max_built_area]);
            } elseif ($request->filled('min_built_area')) {
                $q->where('built_area', '>=', $request->min_built_area);
            } elseif ($request->filled('max_built_area')) {
                $q->where('built_area', '<=', $request->max_built_area);
            }
        });

        if ($request->filled('address_city')) {
            $query->where('address_city', 'like', "%{$request->address_city}%");
        }

        if ($request->filled('address_neighborhood')) {
            $query->where('address_neighborhood', 'like', "%{$request->address_neighborhood}%");
        }

        $perPage = $request->input('per_page', 25);
        $allowedPerPage = [5, 10, 15, 20, 25, 30, 50, 100];
        if (!in_array((int)$perPage, $allowedPerPage)) {
            $perPage = 25;
        }

        return response()->json($query->latest()->paginate($perPage));
    }

    /**
     * Cria um imóvel novo e devolve o registro completo (código 201).
     *
     * Conferência dos dados: título, tipo e preço de venda são obrigatórios.
     * Endereço e proprietário são opcionais. O status, se vier, só pode ser
     * draft, available, reserved ou sold. Se não vier, o banco grava "draft".
     *
     * Se o nome do proprietário vier preenchido, cria um registro em owners
     * e liga ao imóvel. Sem nome, o imóvel fica sem dono.
     *
     * O slug é gerado aqui: versão do título sem acento e sem espaço,
     * mais um código único (uniqid), para dois imóveis com o mesmo título
     * não disputarem a mesma URL.
     * user_id recebe o id de quem está logado, para saber quem cadastrou.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'property_type' => 'required|string|max:50',
            'land_area' => 'nullable|numeric',
            'built_area' => 'nullable|numeric',
            'sale_price' => 'required|numeric',
            'condo_price' => 'nullable|numeric',
            'iptu' => 'nullable|numeric',
            'bedrooms' => 'nullable|integer|min:0',
            'suites' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'garage_spots' => 'nullable|integer|min:0',
            'status' => 'in:draft,available,reserved,sold',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_complement' => 'nullable|string|max:255',
            'address_neighborhood' => 'nullable|string|max:255',
            'address_city' => 'nullable|string|max:255',
            'address_state' => 'nullable|string|size:2',
            'address_zip' => 'nullable|string|max:10',
            'owner' => 'nullable|array',
            'owner.name' => 'nullable|string|max:255',
            'owner.phone' => 'nullable|string|max:20',
            'owner.email' => 'nullable|email|max:255',
        ]);

        if (!empty($data['owner']['name'])) {
            $ownerData = $data['owner'];
            unset($data['owner']);
            $owner = \App\Models\Owner::create($ownerData);
        } else {
            unset($data['owner']);
        }

        $data['slug'] = Str::slug($data['title']) . '-' . uniqid();
        $data['user_id'] = $request->user()->id;

        $property = Property::create($data);
        if (isset($owner)) {
            $property->owner()->associate($owner);
            $property->save();
        }

        return response()->json($property->load(['owner', 'photos']), 201);
    }

    /**
     * Devolve um imóvel para a tela interna (edição e visualização).
     *
     * O {property} da URL é o id numérico. O Laravel busca a linha sozinho
     * (route model binding). Se o id não existir, responde 404.
     * Inclui proprietário e fotos. Esta rota exige login, diferente da
     * página pública (showPublic), que busca pelo slug e esconde rascunho.
     */
    public function show(Property $property)
    {
        return response()->json($property->load(['owner', 'photos']));
    }

    /**
     * Atualiza os campos enviados de um imóvel que já existe.
     *
     * "sometimes" no título, tipo e preço significa: se o campo não vier
     * na requisição, não é obrigatório e o valor antigo permanece.
     * É assim que o botão Publicar funciona: manda só { status: available }.
     *
     * Proprietário:
     *   - se o imóvel já tem dono, atualiza nome, telefone e e-mail dele;
     *   - se não tem e veio um nome, cria o dono e associa.
     * Sem nome, a parte do proprietário é ignorada.
     */
    public function update(Request $request, Property $property)
    {
        $data = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'property_type' => 'sometimes|string|max:50',
            'land_area' => 'nullable|numeric',
            'built_area' => 'nullable|numeric',
            'sale_price' => 'sometimes|numeric',
            'condo_price' => 'nullable|numeric',
            'iptu' => 'nullable|numeric',
            'bedrooms' => 'nullable|integer|min:0',
            'suites' => 'nullable|integer|min:0',
            'bathrooms' => 'nullable|integer|min:0',
            'garage_spots' => 'nullable|integer|min:0',
            'status' => 'in:draft,available,reserved,sold',
            'address_street' => 'nullable|string|max:255',
            'address_number' => 'nullable|string|max:20',
            'address_complement' => 'nullable|string|max:255',
            'address_neighborhood' => 'nullable|string|max:255',
            'address_city' => 'nullable|string|max:255',
            'address_state' => 'nullable|string|size:2',
            'address_zip' => 'nullable|string|max:10',
            'owner' => 'nullable|array',
            'owner.name' => 'nullable|string|max:255',
            'owner.phone' => 'nullable|string|max:20',
            'owner.email' => 'nullable|email|max:255',
        ]);

        if (isset($data['owner']) && !empty($data['owner']['name'])) {
            if ($property->owner) {
                $property->owner->update($data['owner']);
            } else {
                $owner = \App\Models\Owner::create($data['owner']);
                $property->owner()->associate($owner);
                $property->save();
            }
            unset($data['owner']);
        }

        $property->update($data);

        return response()->json($property->load(['owner', 'photos']));
    }

    /**
     * Apaga o imóvel de forma permanente.
     *
     * Primeiro remove os arquivos de foto do disco (pasta public).
     * Depois apaga a linha do imóvel. As linhas de property_photos somem
     * junto, por causa do cascadeOnDelete definido na migration.
     * O registro do proprietário em owners não é apagado.
     */
    public function destroy(Property $property)
    {
        foreach ($property->photos as $photo) {
            Storage::disk('public')->delete($photo->path);
        }
        $property->delete();

        return response()->json(['message' => 'Imóvel removido com sucesso.']);
    }

    /**
     * Cria uma cópia do imóvel, do proprietário e dos arquivos de foto.
     *
     * A cópia nasce como rascunho (status draft) e ganha um slug novo,
     * para não repetir a URL. O user_id passa a ser quem clicou em
     * Duplicar, não quem cadastrou o original.
     *
     * replicate() copia os campos e descarta id, slug, user_id e datas,
     * que são preenchidos de novo. As fotos são copiadas arquivo por
     * arquivo para properties/{id-novo}/, com nome aleatório, e cada
     * cópia ganha uma linha nova em property_photos. Se o arquivo
     * original não existir no disco, aquela foto é pulada.
     */
    public function duplicate(Property $property)
    {
        $property->load(['owner', 'photos']);

        $newProperty = $property->replicate([
            'id', 'slug', 'user_id', 'created_at', 'updated_at',
        ]);
        $newProperty->slug = Str::slug($newProperty->title) . '-' . uniqid();
        $newProperty->status = 'draft';
        $newProperty->user_id = auth()->id();
        $newProperty->save();

        if ($property->owner) {
            $newOwner = $property->owner->replicate();
            $newOwner->save();
            $newProperty->owner()->associate($newOwner);
            $newProperty->save();
        }

        if ($property->photos->isNotEmpty()) {
            Storage::disk('public')->makeDirectory("properties/{$newProperty->id}");
            foreach ($property->photos as $photo) {
                if (Storage::disk('public')->exists($photo->path)) {
                    $ext = pathinfo($photo->path, PATHINFO_EXTENSION);
                    $newFilename = Str::random(40) . '.' . $ext;
                    $newPath = "properties/{$newProperty->id}/{$newFilename}";
                    Storage::disk('public')->copy($photo->path, $newPath);

                    PropertyPhoto::create([
                        'property_id' => $newProperty->id,
                        'path' => $newPath,
                        'is_main' => $photo->is_main,
                        'order' => $photo->order,
                    ]);
                }
            }
        }

        return response()->json($newProperty->load(['owner', 'photos']), 201);
    }

    /**
     * Recebe uma ou mais fotos, grava no disco e aplica a marca d'água.
     *
     * O campo do formulário se chama "photos" e pode trazer vários arquivos
     * (máximo de 10 MB cada). O tipo de imagem não é restringido aqui além
     * de ser um arquivo; a marca d'água só é desenhada em JPEG, PNG, WEBP
     * e AVIF. Outros formatos ficam salvos sem marca.
     *
     * O bloco de Log::info no início é diagnóstico: registra tipo, tamanho
     * e se o PHP aceitou o arquivo. Ajuda quando um upload chega vazio.
     *
     * Se is_main vier verdadeiro, só a primeira foto do lote vira capa e
     * as capas anteriores deste imóvel são desmarcadas.
     * A ordem de cada foto nova é a quantidade de fotos que o imóvel já tem.
     */
    public function uploadPhotos(Request $request, Property $property)
    {
        $files = $request->file('photos', []);
        $fileInfos = [];
        foreach ($files as $idx => $f) {
            $fileInfos[$idx] = [
                'valid' => $f->isValid(),
                'mime' => $f->getMimeType(),
                'ext' => $f->getClientOriginalExtension(),
                'size' => $f->getSize(),
                'error' => $f->getError(),
                'tmp' => $f->getPathname(),
            ];
        }
        \Illuminate\Support\Facades\Log::info('Upload debug', [
            'content_type' => $request->header('Content-Type'),
            'has_files' => $request->hasFile('photos'),
            'file_count' => count($files),
            'file_infos' => $fileInfos,
        ]);

        $request->validate([
            'photos' => 'required|array',
            'photos.*' => 'file|max:10240',
            'is_main' => 'boolean',
        ]);

        $uploaded = [];

        foreach ($request->file('photos') as $index => $file) {
            $path = $file->store('properties/' . $property->id, 'public');

            // Desenha a marca d'água por cima do arquivo já salvo.
            // Se o arquivo não estiver no disco, applyWatermark só registra aviso e segue.
            $fullPath = Storage::disk('public')->path($path);
            if (file_exists($fullPath)) {
                $this->applyWatermark($fullPath);
            }

            if ($request->boolean('is_main') && $index === 0) {
                $property->photos()->update(['is_main' => false]);
            }

            $photo = $property->photos()->create([
                'path' => $path,
                'is_main' => $request->boolean('is_main') && $index === 0,
                'order' => $property->photos()->count(),
            ]);

            $uploaded[] = $photo;
        }

        return response()->json($uploaded, 201);
    }

    /**
     * Apaga uma foto: o arquivo no disco e a linha no banco.
     *
     * A URL traz o id do imóvel e o id da foto. A conferência abaixo impede
     * apagar uma foto que pertence a outro imóvel (resposta 403).
     */
    public function deletePhoto(Property $property, PropertyPhoto $photo)
    {
        if ($photo->property_id !== $property->id) {
            return response()->json(['message' => 'Foto não pertence ao imóvel.'], 403);
        }

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        return response()->json(['message' => 'Foto removida com sucesso.']);
    }

    /**
     * Desenha a marca d'água no canto inferior direito da imagem e salva
     * por cima do mesmo arquivo.
     *
     * Usa só a extensão GD do PHP, sem biblioteca externa de imagem.
     * É público porque o comando de console watermark:reprocess chama
     * este método direto, fora de uma requisição HTTP.
     *
     * O que ele faz, em ordem:
     * 1. Abre o arquivo conforme o tipo (JPEG, PNG, WEBP ou AVIF).
     *    AVIF só funciona se o GD desta instalação tiver essa função.
     *    Tipo desconhecido ou arquivo ausente: registra um aviso e sai,
     *    sem interromper o upload das outras fotos.
     * 2. Calcula margem e tamanho da fonte em proporção à largura.
     * 3. Procura uma fonte TrueType no Windows, no Linux ou em storage/fonts.
     *    Se não achar nenhuma, usa a fonte embutida do GD (menos nítida).
     * 4. Desenha um bloco escuro semitransparente, um ícone simples de
     *    prédio e o texto "GANNAM & LAGE - VENDAS" em branco, com sombra.
     * 5. Grava o arquivo no mesmo caminho, com qualidade 92 (JPEG/WEBP/AVIF)
     *    ou compressão 6 (PNG), e libera a memória da imagem.
     */
    public function applyWatermark(string $fullPath)
    {
        if (!file_exists($fullPath)) {
            \Illuminate\Support\Facades\Log::warning('Watermark: arquivo nao existe', ['path' => $fullPath]);
            return;
        }

        $mime = mime_content_type($fullPath);

        // Abre a imagem original de acordo com o tipo real do arquivo (não a extensão do nome).
        switch ($mime) {
            case 'image/jpeg':
                $image = imagecreatefromjpeg($fullPath);
                break;
            case 'image/png':
                $image = imagecreatefrompng($fullPath);
                break;
            case 'image/webp':
                $image = imagecreatefromwebp($fullPath);
                break;
            case 'image/avif':
                if (!function_exists('imagecreatefromavif')) {
                    \Illuminate\Support\Facades\Log::warning('Watermark: GD sem suporte a AVIF', ['mime' => $mime]);
                    return;
                }
                $image = imagecreatefromavif($fullPath);
                break;
            default:
                \Illuminate\Support\Facades\Log::warning('Watermark: mime nao suportado', ['mime' => $mime]);
                return;
        }

        if (!$image) {
            \Illuminate\Support\Facades\Log::warning('Watermark: falha ao abrir imagem', ['path' => $fullPath]);
            return;
        }

        // Permite desenhar cores semitransparentes por cima da foto.
        imagealphablending($image, true);
        imagesavealpha($image, true);

        $width = imagesx($image);
        $height = imagesy($image);

        \Illuminate\Support\Facades\Log::info('Watermark: aplicando', [
            'path' => $fullPath,
            'mime' => $mime,
            'width' => $width,
            'height' => $height,
        ]);

        // Margem do canto inferior direito: 3% do lado, com mínimo de 15 pixels.
        $marginX = max(15, intval($width * 0.03));
        $marginY = max(15, intval($height * 0.03));

        // Fonte proporcional à largura, limitada entre 12 e 24 pixels.
        $fontSize = max(12, min(24, intval($width / 28)));

        // Procura uma fonte .ttf instalada. A primeira que existir é a usada.
        $fontPath = null;
        $possibleFonts = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/segoeui.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
            '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
            '/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
            '/usr/share/fonts/truetype/freefont/FreeSans.ttf',
            '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
            base_path('storage/fonts/LiberationSans-Regular.ttf'),
            base_path('storage/fonts/arial.ttf'),
        ];
        foreach ($possibleFonts as $f) {
            if (file_exists($f)) {
                $fontPath = $f;
                break;
            }
        }

        // Texto fixo da imobiliária, desenhado em toda foto enviada.
        $text = 'GANNAM & LAGE - VENDAS';

        // Mede a largura e a altura do texto para centralizar dentro do bloco.
        $textW = 0;
        $textH = 0;
        if ($fontPath) {
            $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
            $textW = abs($bbox[2] - $bbox[0]);
            $textH = abs($bbox[1] - $bbox[7]);
        } else {
            $textW = strlen($text) * imagefontwidth(5) + 10;
            $textH = imagefontheight(5) + 6;
            $fontSize = 5; // imagefont index
        }

        // Espaço interno entre a borda do bloco e o desenho.
        $padX = 14;
        $padY = 10;

        // Altura do bloco: ícone do prédio + folga + texto + margens internas.
        $iconH = 34;
        $iconGap = 6;
        $blockH = $iconH + $iconGap + $textH + $padY * 2;
        $blockW = max($textW + $padX * 2, 120);

        // Encosta o bloco no canto inferior direito, respeitando a margem.
        $blockX = $width - $blockW - $marginX;
        $blockY = $height - $blockH - $marginY;

        // Fundo preto semitransparente. No GD, 127 é invisível e 0 é opaco; 100 fica no meio.
        $bgColor = imagecolorallocatealpha($image, 0, 0, 0, 100);
        imagefilledrectangle($image, $blockX, $blockY, $blockX + $blockW, $blockY + $blockH, $bgColor);

        // Cor reservada para cantos. O retângulo abaixo é que pinta o fundo.
        $cornerColor = imagecolorallocatealpha($image, 0, 0, 0, 100);

        // Ícone simples de prédio: corpo, telhado, janelas e porta.
        $iconPadding = 10;
        $iconX = $blockX + $iconPadding;
        $iconY = $blockY + $padY;
        $iconW = $blockW - $iconPadding * 2;

        // Corpo do prédio.
        $buildingColor = imagecolorallocatealpha($image, 200, 200, 200, 20);
        imagefilledrectangle($image, $iconX, $iconY, $iconX + $iconW, $iconY + $iconH, $buildingColor);

        // Telhado, desenhado como um triângulo.
        $roofColor = imagecolorallocatealpha($image, 180, 180, 180, 20);
        $roofPoints = [
            $iconX, $iconY + 8,
            $iconX + intval($iconW / 2), $iconY,
            $iconX + $iconW, $iconY + 8,
        ];
        imagefilledpolygon($image, $roofPoints, $roofColor);

        // Duas fileiras de janelas, distribuídas na largura do ícone.
        $winColor = imagecolorallocatealpha($image, 255, 255, 255, 10);
        $winW = 8;
        $winH = 8;
        $winGap = 5;
        $winStartY = $iconY + 12;
        for ($wx = $iconX + 6; $wx + $winW < $iconX + $iconW - 6; $wx += $winW + $winGap) {
            imagefilledrectangle($image, $wx, $winStartY, $wx + $winW, $winStartY + $winH, $winColor);
            imagefilledrectangle($image, $wx, $winStartY + $winH + 4, $wx + $winW, $winStartY + $winH * 2 + 4, $winColor);
        }
        // Porta, no canto direito do ícone.
        imagefilledrectangle($image, $iconX + $iconW - 14, $winStartY + $winH + 2, $iconX + $iconW - 4, $iconY + $iconH - 2, $winColor);

        // Texto centralizado, logo abaixo do ícone.
        $textX = $blockX + intval(($blockW - $textW) / 2);
        $textY = $blockY + $iconH + $iconGap + $padY + intval($textH * 0.85);

        // Sombra preta do texto e a cor branca do texto principal.
        $shadowColor = imagecolorallocatealpha($image, 0, 0, 0, 60);
        $textColor = imagecolorallocate($image, 255, 255, 255);

        if ($fontPath) {
            // Sombra, dois pixels abaixo e à direita do texto.
            imagettftext($image, $fontSize, 0, $textX + 2, $textY + 2, $shadowColor, $fontPath, $text);
            // Texto principal, na posição calculada.
            imagettftext($image, $fontSize, 0, $textX, $textY, $textColor, $fontPath, $text);
        } else {
            imagestring($image, $fontSize, intval($textX), intval($textY - $textH + 4), $text, $textColor);
        }

        // Grava por cima do arquivo original, no mesmo formato em que foi aberto.
        switch ($mime) {
            case 'image/jpeg':
                imagejpeg($image, $fullPath, 92);
                break;
            case 'image/png':
                imagepng($image, $fullPath, 6);
                break;
            case 'image/webp':
                imagewebp($image, $fullPath, 92);
                break;
            case 'image/avif':
                if (function_exists('imageavif')) {
                    imageavif($image, $fullPath, 92);
                }
                break;
        }

        imagedestroy($image);

        \Illuminate\Support\Facades\Log::info('Watermark: aplicado com sucesso', ['path' => $fullPath]);
    }

    /**
     * Passa applyWatermark em toda foto já cadastrada.
     *
     * Existe como rota POST /api/reprocess-watermarks (exige login) e também
     * como o comando php artisan watermark:reprocess, que faz o mesmo
     * trabalho pelo terminal, sem passar por esta função.
     *
     * Foto cujo arquivo sumiu do disco conta como erro e segue para a próxima.
     * A resposta informa total, quantas deram certo e quantas falharam.
     * Atenção: rodar de novo desenha a marca outra vez por cima da anterior.
     */
    public function reprocessWatermarks()
    {
        $photos = \App\Models\PropertyPhoto::all();
        $count = 0;
        $errors = 0;

        foreach ($photos as $photo) {
            $fullPath = Storage::disk('public')->path($photo->path);
            if (!file_exists($fullPath)) {
                $errors++;
                continue;
            }
            try {
                $this->applyWatermark($fullPath);
                $count++;
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error('Erro ao reprocessar watermark', [
                    'path' => $photo->path,
                    'error' => $e->getMessage(),
                ]);
                $errors++;
            }
        }

        return response()->json([
            'message' => 'Reprocessamento concluido',
            'total' => $photos->count(),
            'success' => $count,
            'errors' => $errors,
        ]);
    }

    /**
     * Dá baixa no imóvel: muda o status para "sold" e não apaga nada.
     *
     * O imóvel continua no painel, no filtro "Vendidas". A página pública
     * ainda abre, porque showPublic só esconde status "draft".
     */
    public function sell(Property $property)
    {
        $property->update(['status' => 'sold']);

        return response()->json($property->load(['owner', 'photos']));
    }

    /**
     * Devolve o imóvel para a página pública /p/{slug}, sem exigir login.
     *
     * Busca pelo slug, não pelo id. Rascunho (draft) não é encontrado:
     * para o visitante, a resposta é 404, igual a um slug inexistente.
     * Não inclui o proprietário de propósito. A landing só pede as fotos,
     * para nome, telefone e e-mail do dono não irem para quem não está logado.
     */
    public function showPublic(string $slug)
    {
        $property = Property::with('photos')
            ->where('slug', $slug)
            ->where('status', '!=', 'draft')
            ->firstOrFail();

        return response()->json($property);
    }

    /**
     * Transforma um pedaço de texto de dinheiro em número.
     *
     * Usado só pela busca livre do index. Exemplos:
     *   "400.000"     -> 400000
     *   "400k"        -> 400000  (k, mil e m multiplicam por 1000)
     *   "1.500,50"    -> o ponto de milhar é removido e a vírgula vira ponto
     *
     * É privado: nenhuma rota chama este método diretamente.
     */
    private function parseMoney(string $value, string $suffix = ''): float
    {
        $clean = str_replace(['.', ' ', ','], ['', '', '.'], $value);
        $num = (float) $clean;
        $suffix = mb_strtolower(trim($suffix));
        if (in_array($suffix, ['k', 'mil', 'm'])) {
            $num *= 1000;
        }
        return $num;
    }
}
