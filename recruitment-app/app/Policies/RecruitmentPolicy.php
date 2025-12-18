<?php

namespace App\Policies;

use App\Models\Recruitment;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RecruitmentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        // All authenticated users can view recruitments
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Recruitment $recruitment): bool
    {
        // All authenticated users can view a single recruitment
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        // Only admin and recruiter can create recruitments
        return in_array($user->role, ['admin', 'recruiter']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Recruitment $recruitment): bool
    {
        // Only admin or the creator can update
        return $user->role === 'admin' || $recruitment->created_by === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Recruitment $recruitment): bool
    {
        // Only admin or the creator can delete
        return $user->role === 'admin' || $recruitment->created_by === $user->id;
    }

    /**
     * Determine whether the user can publish the model.
     */
    public function publish(User $user, Recruitment $recruitment): bool
    {
        // Only admin or the creator can publish
        return $user->role === 'admin' || $recruitment->created_by === $user->id;
    }

    /**
     * Determine whether the user can close the model.
     */
    public function close(User $user, Recruitment $recruitment): bool
    {
        // Only admin or the creator can close
        return $user->role === 'admin' || $recruitment->created_by === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Recruitment $recruitment): bool
    {
        return $user->role === 'admin';
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Recruitment $recruitment): bool
    {
        return $user->role === 'admin';
    }
}
