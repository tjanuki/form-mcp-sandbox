<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Recruitment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ApplicationController extends Controller
{
    public function index(Recruitment $recruitment, Request $request): JsonResponse
    {
        $query = $recruitment->applications();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $applications = $query->latest('applied_at')->get();

        return response()->json([
            'recruitment_id' => $recruitment->id,
            'recruitment_title' => $recruitment->title,
            'applications' => $applications,
            'total' => $applications->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recruitment_id' => 'required|exists:recruitments,id',
            'applicant_name' => 'required|string|max:255',
            'applicant_email' => 'required|email|max:255',
            'applicant_phone' => 'nullable|string|max:255',
            'resume_path' => 'nullable|string',
            'cover_letter' => 'nullable|string',
        ]);

        $application = Application::create($validated);

        return response()->json($application, 201);
    }

    public function show(Application $application): JsonResponse
    {
        return response()->json($application->load('recruitment'));
    }

    public function updateStatus(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,reviewing,shortlisted,rejected,hired',
        ]);

        $application->update($validated);

        return response()->json($application);
    }
}
