<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyVisitController;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('properties/filter-options', [PropertyController::class, 'filterOptions']);
    Route::get('properties/{property}/internal', [PropertyVisitController::class, 'internal']);
    Route::post('properties/{property}/reserve', [PropertyVisitController::class, 'reserve']);
    Route::post('properties/{property}/release-reservation', [PropertyVisitController::class, 'release']);
    Route::apiResource('properties', PropertyController::class);
    Route::post('properties/{property}/photos', [PropertyController::class, 'uploadPhotos']);
    Route::post('properties/{property}/duplicate', [PropertyController::class, 'duplicate']);
    Route::delete('properties/{property}/photos/{photo}', [PropertyController::class, 'deletePhoto']);
    Route::post('properties/{property}/sell', [PropertyController::class, 'sell']);
    Route::post('reprocess-watermarks', [PropertyController::class, 'reprocessWatermarks']);
});

Route::get('/public/properties/{slug}', [PropertyController::class, 'showPublic']);
