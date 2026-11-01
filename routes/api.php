<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::apiResource('properties', PropertyController::class);
    Route::post('properties/{property}/photos', [PropertyController::class, 'uploadPhotos']);
    Route::post('properties/{property}/duplicate', [PropertyController::class, 'duplicate']);
    Route::delete('properties/{property}/photos/{photo}', [PropertyController::class, 'deletePhoto']);
    Route::post('properties/{property}/sell', [PropertyController::class, 'sell']);
    Route::post('reprocess-watermarks', [PropertyController::class, 'reprocessWatermarks']);
});

Route::get('/public/properties/{slug}', [PropertyController::class, 'showPublic']);
