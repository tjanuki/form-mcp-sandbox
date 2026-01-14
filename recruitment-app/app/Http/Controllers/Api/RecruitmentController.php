<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecruitmentRequest;
use App\Http\Requests\UpdateRecruitmentRequest;
use App\Http\Resources\RecruitmentResource;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecruitmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Recruitment::class);

        $query = Recruitment::query()->with('creator')->withCount('applications');

        // Filter by creator (user-scoped access for non-admin users)
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('employment_type')) {
            $query->where('employment_type', $request->employment_type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('company_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('limit', 10);
        $recruitments = $query->latest()->paginate($perPage);

        return RecruitmentResource::collection($recruitments)
            ->response()
            ->setStatusCode(200);
    }

    public function store(StoreRecruitmentRequest $request): JsonResponse
    {
        $this->authorize('create', Recruitment::class);

        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;

        // Dedupe guard: Check for identical draft created within last 60 seconds by same user
        $existing = Recruitment::where('created_by', $validated['created_by'])
            ->where('title', $validated['title'])
            ->where('company_name', $validated['company_name'])
            ->where('location', $validated['location'])
            ->where('employment_type', $validated['employment_type'])
            ->where('created_at', '>=', now()->subSeconds(60))
            ->first();

        if ($existing) {
            return (new RecruitmentResource($existing->load('creator')))
                ->response()
                ->setStatusCode(200);
        }

        if (isset($validated['status']) && $validated['status'] === 'published') {
            $validated['published_at'] = now();
        }

        $recruitment = Recruitment::create($validated);

        return (new RecruitmentResource($recruitment->load('creator')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Recruitment $recruitment): JsonResponse
    {
        $this->authorize('view', $recruitment);

        return (new RecruitmentResource($recruitment->load(['creator', 'applications'])))
            ->response()
            ->setStatusCode(200);
    }

    public function update(UpdateRecruitmentRequest $request, Recruitment $recruitment): JsonResponse
    {
        $this->authorize('update', $recruitment);

        $validated = $request->validated();

        if (isset($validated['status']) && $validated['status'] === 'published' && !$recruitment->published_at) {
            $validated['published_at'] = now();
        }

        $recruitment->update($validated);

        return (new RecruitmentResource($recruitment->load('creator')))
            ->response()
            ->setStatusCode(200);
    }

    public function destroy(Recruitment $recruitment): JsonResponse
    {
        $this->authorize('delete', $recruitment);

        $recruitment->delete();

        return response()->json([
            'message' => 'Recruitment deleted successfully'
        ], 200);
    }

    public function publish(Recruitment $recruitment): JsonResponse
    {
        $this->authorize('publish', $recruitment);

        $recruitment->update([
            'status' => 'published',
            'published_at' => $recruitment->published_at ?? now(),
        ]);

        return (new RecruitmentResource($recruitment->load('creator')))
            ->response()
            ->setStatusCode(200);
    }

    public function close(Recruitment $recruitment): JsonResponse
    {
        $this->authorize('close', $recruitment);

        $recruitment->update(['status' => 'closed']);

        return (new RecruitmentResource($recruitment->load('creator')))
            ->response()
            ->setStatusCode(200);
    }
}
