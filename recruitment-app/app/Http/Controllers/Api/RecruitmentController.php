<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class RecruitmentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Recruitment::query()->with('creator', 'applications');

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

        return response()->json($recruitments);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'company_name' => 'required|string|max:255',
            'location' => 'required|string|max:255',
            'employment_type' => 'required|in:full-time,part-time,contract,internship',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:10',
            'description' => 'required|string',
            'requirements' => 'required|string',
            'responsibilities' => 'required|string',
            'benefits' => 'nullable|string',
            'application_deadline' => 'nullable|date',
            'status' => 'nullable|in:draft,published,closed,filled',
        ]);

        $validated['created_by'] = $request->user()->id;

        if (isset($validated['status']) && $validated['status'] === 'published' && !isset($validated['published_at'])) {
            $validated['published_at'] = now();
        }

        $recruitment = Recruitment::create($validated);

        return response()->json($recruitment->load('creator'), 201);
    }

    public function show(Recruitment $recruitment): JsonResponse
    {
        return response()->json($recruitment->load(['creator', 'applications']));
    }

    public function update(Request $request, Recruitment $recruitment): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'company_name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'employment_type' => 'sometimes|in:full-time,part-time,contract,internship',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0',
            'salary_currency' => 'nullable|string|max:10',
            'description' => 'sometimes|string',
            'requirements' => 'sometimes|string',
            'responsibilities' => 'sometimes|string',
            'benefits' => 'nullable|string',
            'application_deadline' => 'nullable|date',
            'status' => 'nullable|in:draft,published,closed,filled',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'published' && !$recruitment->published_at) {
            $validated['published_at'] = now();
        }

        $recruitment->update($validated);

        return response()->json($recruitment->load('creator'));
    }

    public function destroy(Recruitment $recruitment): JsonResponse
    {
        $recruitment->delete();

        return response()->json(['message' => 'Recruitment deleted successfully']);
    }

    public function publish(Recruitment $recruitment): JsonResponse
    {
        $recruitment->update([
            'status' => 'published',
            'published_at' => $recruitment->published_at ?? now(),
        ]);

        return response()->json($recruitment->load('creator'));
    }

    public function close(Recruitment $recruitment): JsonResponse
    {
        $recruitment->update(['status' => 'closed']);

        return response()->json($recruitment->load('creator'));
    }
}
