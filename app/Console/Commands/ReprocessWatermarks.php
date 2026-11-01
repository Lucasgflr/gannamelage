<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PropertyPhoto;
use App\Http\Controllers\Api\PropertyController;
use Illuminate\Support\Facades\Storage;

class ReprocessWatermarks extends Command
{
    protected $signature = 'watermark:reprocess';
    protected $description = 'Reaplica marca d\'agua em todas as fotos existentes de imoveis';

    public function handle()
    {
        $controller = new PropertyController();
        $photos = PropertyPhoto::all();
        $count = 0;
        $errors = 0;

        $this->info("Processando {$photos->count()} fotos...");

        foreach ($photos as $photo) {
            $fullPath = Storage::disk('public')->path($photo->path);
            if (!file_exists($fullPath)) {
                $this->warn("Arquivo nao encontrado: {$photo->path}");
                $errors++;
                continue;
            }

            try {
                $controller->applyWatermark($fullPath);
                $count++;
                $this->info("OK: {$photo->path}");
            } catch (\Exception $e) {
                $this->error("ERRO em {$photo->path}: " . $e->getMessage());
                $errors++;
            }
        }

        $this->info("\nConcluido! {$count} sucesso(s), {$errors} erro(s).");
        return 0;
    }
}
