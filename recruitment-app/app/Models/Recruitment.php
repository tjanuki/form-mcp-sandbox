<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Recruitment extends Model
{
    protected $fillable = [
        'title',
        'company_name',
        'location',
        'employment_type',
        'salary_min',
        'salary_max',
        'salary_currency',
        'description',
        'requirements',
        'responsibilities',
        'benefits',
        'application_deadline',
        'status',
        'created_by',
        'published_at',
    ];

    protected $casts = [
        'salary_min' => 'decimal:2',
        'salary_max' => 'decimal:2',
        'application_deadline' => 'date',
        'published_at' => 'datetime',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'published')
            ->where(function ($q) {
                $q->whereNull('application_deadline')
                    ->orWhere('application_deadline', '>=', now());
            });
    }
}
