<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Application extends Model
{
    protected $fillable = [
        'recruitment_id',
        'applicant_name',
        'applicant_email',
        'applicant_phone',
        'resume_path',
        'cover_letter',
        'status',
        'applied_at',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
    ];

    public function recruitment(): BelongsTo
    {
        return $this->belongsTo(Recruitment::class);
    }
}
