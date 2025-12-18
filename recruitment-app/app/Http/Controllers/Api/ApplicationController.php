<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationStatusRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApplicationController extends Controller
{
    public function index(Recruitment $recruitment, Request $request): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        $query = $recruitment->applications();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->latest('applied_at')->get();

        return response()->json([
            'recruitment_id' => $recruitment->id,
            'recruitment_title' => $recruitment->title,
            'applications' => ApplicationResource::collection($applications),
            'total' => $applications->count(),
        ], 200);
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $application = Application::create($validated);

        return (new ApplicationResource($application))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        return (new ApplicationResource($application->load('recruitment')))
            ->response()
            ->setStatusCode(200);
    }

    public function updateStatus(UpdateApplicationStatusRequest $request, Application $application): JsonResponse
    {
        $this->authorize('updateStatus', $application);

        $validated = $request->validated();
        $application->update($validated);

        return (new ApplicationResource($application))
            ->response()
            ->setStatusCode(200);
    }
}
