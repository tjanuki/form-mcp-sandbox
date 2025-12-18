<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RecruitmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'company_name' => $this->company_name,
            'location' => $this->location,
            'employment_type' => $this->employment_type,
            'salary_min' => $this->salary_min,
            'salary_max' => $this->salary_max,
            'salary_currency' => $this->salary_currency,
            'salary_range' => $this->salary_min && $this->salary_max
                ? number_format($this->salary_min, 0) . ' - ' . number_format($this->salary_max, 0) . ' ' . $this->salary_currency
                : null,
            'description' => $this->description,
            'requirements' => $this->requirements,
            'responsibilities' => $this->responsibilities,
            'benefits' => $this->benefits,
            'application_deadline' => $this->application_deadline?->format('Y-m-d'),
            'status' => $this->status,
            'creator' => new UserResource($this->whenLoaded('creator')),
            'applications_count' => $this->whenCounted('applications'),
            'applications' => ApplicationResource::collection($this->whenLoaded('applications')),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'published_at' => $this->published_at?->toIso8601String(),
        ];
    }
}
