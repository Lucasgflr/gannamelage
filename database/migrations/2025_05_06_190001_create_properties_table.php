<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('property_type');
            $table->decimal('land_area', 12, 2)->nullable();
            $table->decimal('built_area', 12, 2)->nullable();
            $table->decimal('sale_price', 15, 2);
            $table->decimal('condo_price', 15, 2)->default(0);
            $table->unsignedInteger('bedrooms')->default(0);
            $table->unsignedInteger('suites')->default(0);
            $table->unsignedInteger('bathrooms')->default(0);
            $table->unsignedInteger('garage_spots')->default(0);
            $table->enum('status', ['draft', 'available', 'reserved', 'sold'])->default('draft');
            $table->string('slug')->unique();
            $table->string('address_street');
            $table->string('address_number')->nullable();
            $table->string('address_complement')->nullable();
            $table->string('address_neighborhood');
            $table->string('address_city');
            $table->string('address_state', 2);
            $table->string('address_zip', 10);
            $table->foreignId('owner_id')->nullable()->constrained('owners')->nullOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            $table->index('status');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
