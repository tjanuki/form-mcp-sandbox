<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Recruitment>
 */
class RecruitmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $employmentTypes = ['full-time', 'part-time', 'contract', 'internship'];
        $statuses = ['draft', 'published', 'closed', 'filled'];

        return [
            'title' => fake()->jobTitle(),
            'company_name' => fake()->company(),
            'location' => fake()->city() . ', ' . fake()->stateAbbr(),
            'employment_type' => fake()->randomElement($employmentTypes),
            'salary_min' => fake()->numberBetween(50000, 100000),
            'salary_max' => fake()->numberBetween(100000, 200000),
            'salary_currency' => 'USD',
            'description' => fake()->paragraph(3),
            'requirements' => fake()->paragraph(2),
            'responsibilities' => fake()->paragraph(2),
            'benefits' => fake()->optional()->paragraph(),
            'application_deadline' => fake()->optional()->dateTimeBetween('now', '+60 days'),
            'status' => fake()->randomElement($statuses),
            'created_by' => \App\Models\User::factory(),
            'published_at' => function (array $attributes) {
                return $attributes['status'] === 'published' ? now() : null;
            },
        ];
    }
}
