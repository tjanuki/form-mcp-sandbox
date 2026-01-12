<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OAuthController;
use App\Http\Controllers\Api\RecruitmentController;
use App\Http\Controllers\Api\ApplicationController;
use App\Http\Controllers\Api\StatisticsController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// OAuth endpoints for MCP server token validation
Route::post('/oauth/token/introspect', [OAuthController::class, 'introspect']);
Route::middleware('auth:api')->get('/oauth/userinfo', [OAuthController::class, 'userinfo']);

Route::middleware('auth:api')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    Route::apiResource('recruitments', RecruitmentController::class);
    Route::patch('/recruitments/{recruitment}/publish', [RecruitmentController::class, 'publish']);
    Route::patch('/recruitments/{recruitment}/close', [RecruitmentController::class, 'close']);

    Route::get('/recruitments/{recruitment}/applications', [ApplicationController::class, 'index']);
    Route::post('/applications', [ApplicationController::class, 'store']);
    Route::get('/applications/{application}', [ApplicationController::class, 'show']);
    Route::patch('/applications/{application}/status', [ApplicationController::class, 'updateStatus']);

    Route::get('/statistics/overview', [StatisticsController::class, 'overview']);
    Route::get('/statistics/by-status', [StatisticsController::class, 'byStatus']);
});
