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

        if ($request->has('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $totalRecruitments = $query->count();

        $byStatus = Recruitment::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $byEmploymentType = Recruitment::select('employment_type', DB::raw('count(*) as count'))
            ->groupBy('employment_type')
            ->pluck('count', 'employment_type')
            ->toArray();

        $recentActivity = Recruitment::with('creator')
            ->latest('updated_at')
            ->limit(10)
            ->get()
            ->map(function ($recruitment) {
                return [
                    'recruitment_title' => $recruitment->title,
                    'action' => 'Updated to ' . $recruitment->status,
                    'timestamp' => $recruitment->updated_at->toIso8601String(),
                ];
            });

        $totalApplications = Application::count();

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

    public function byStatus(): JsonResponse
    {
        $byStatus = Recruitment::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status');

        return response()->json($byStatus);
    }
}
