<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Recruitment;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $query = Recruitment::query();

        // Filter by creator (user-scoped access for non-admin users)
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $totalRecruitments = $query->count();

        // Apply same created_by filter to all aggregate queries
        $statusQuery = Recruitment::select('status', DB::raw('count(*) as count'));
        $typeQuery = Recruitment::select('employment_type', DB::raw('count(*) as count'));
        $activityQuery = Recruitment::with('creator')->latest('updated_at')->limit(10);
        $applicationsQuery = Application::query();

        if ($request->has('created_by')) {
            $statusQuery->where('created_by', $request->created_by);
            $typeQuery->where('created_by', $request->created_by);
            $activityQuery->where('created_by', $request->created_by);
            // For applications, filter by recruitments owned by the user
            $applicationsQuery->whereHas('recruitment', function ($q) use ($request) {
                $q->where('created_by', $request->created_by);
            });
        }

        $byStatus = $statusQuery->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $byEmploymentType = $typeQuery->groupBy('employment_type')
            ->pluck('count', 'employment_type')
            ->toArray();

        $recentActivity = $activityQuery->get()
            ->map(function ($recruitment) {
                return [
                    'recruitment_title' => $recruitment->title,
                    'action' => 'Updated to ' . $recruitment->status,
                    'timestamp' => $recruitment->updated_at->toIso8601String(),
                ];
            });

        $totalApplications = $applicationsQuery->count();

        return response()->json([
            'total_recruitments' => $totalRecruitments,
            'by_status' => [
                'draft' => $byStatus['draft'] ?? 0,
                'published' => $byStatus['published'] ?? 0,
                'closed' => $byStatus['closed'] ?? 0,
                'filled' => $byStatus['filled'] ?? 0,
            ],
            'by_employment_type' => $byEmploymentType,
            'recent_activity' => $recentActivity,
            'total_applications' => $totalApplications,
        ]);
    }

    public function byStatus(Request $request): JsonResponse
    {
        $query = Recruitment::select('status', DB::raw('count(*) as count'));

        // Filter by creator (user-scoped access for non-admin users)
        if ($request->has('created_by')) {
            $query->where('created_by', $request->created_by);
        }

        $byStatus = $query->groupBy('status')
            ->pluck('count', 'status');

        return response()->json($byStatus);
    }
}
