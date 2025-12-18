<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApplicationResource extends JsonResource
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
            'recruitment_id' => $this->recruitment_id,
            'recruitment' => new RecruitmentResource($this->whenLoaded('recruitment')),
            'applicant_name' => $this->applicant_name,
            'applicant_email' => $this->applicant_email,
            'applicant_phone' => $this->applicant_phone,
            'resume_path' => $this->resume_path,
            'cover_letter' => $this->cover_letter,
            'status' => $this->status,
            'applied_at' => $this->applied_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
