<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->string('address_street')->nullable()->change();
            $table->string('address_neighborhood')->nullable()->change();
            $table->string('address_city')->nullable()->change();
            $table->string('address_state', 2)->nullable()->change();
            $table->string('address_zip', 10)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            //
        });
    }
};
