<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRecruitmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'company_name' => 'sometimes|string|max:255',
            'location' => 'sometimes|string|max:255',
            'employment_type' => 'sometimes|in:full-time,part-time,contract,internship',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gte:salary_min',
            'salary_currency' => 'nullable|string|max:10',
            'description' => 'sometimes|string',
            'requirements' => 'sometimes|string',
            'responsibilities' => 'sometimes|string',
            'benefits' => 'nullable|string',
            'application_deadline' => 'nullable|date|after:today',
            'status' => 'nullable|in:draft,published,closed,filled',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'salary_max.gte' => 'The maximum salary must be greater than or equal to the minimum salary.',
            'application_deadline.after' => 'The application deadline must be a future date.',
        ];
    }
}
