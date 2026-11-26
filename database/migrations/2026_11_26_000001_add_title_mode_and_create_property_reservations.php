<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table) {
            $table->boolean('title_automatic')->default(false);
            $table->string('title_suffix')->nullable();
        });
        Schema::create('property_reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('property_id')->nullable()->constrained()->nullOnDelete();
            $table->string('property_slug');
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('broker_name');
            $table->dateTime('reserved_at');
            $table->dateTime('expires_at');
            $table->dateTime('released_at')->nullable();
            $table->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('release_reason')->nullable();
            $table->timestamps();
            $table->index(['property_id', 'released_at', 'expires_at'], 'property_reservations_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_reservations');
        Schema::table('properties', function (Blueprint $table) {
            $table->dropColumn(['title_automatic', 'title_suffix']);
        });
    }
};
