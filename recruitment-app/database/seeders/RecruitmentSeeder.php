<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Recruitment;
use App\Models\Application;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RecruitmentSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'role' => 'admin',
        ]);

        $recruiter = User::create([
            'name' => 'Recruiter User',
            'email' => 'recruiter@example.com',
            'password' => Hash::make('password'),
            'role' => 'recruiter',
        ]);

        $recruitments = [
            [
                'title' => 'Senior Full Stack Developer',
                'company_name' => 'TechCorp Inc.',
                'location' => 'Remote',
                'employment_type' => 'full-time',
                'salary_min' => 120000,
                'salary_max' => 150000,
                'salary_currency' => 'USD',
                'description' => 'We are looking for an experienced Full Stack Developer to join our team.',
                'requirements' => '5+ years of experience with React and Node.js, TypeScript, PostgreSQL',
                'responsibilities' => 'Build scalable web applications, mentor junior developers, participate in code reviews',
                'benefits' => 'Health insurance, 401k, remote work, unlimited PTO',
                'application_deadline' => now()->addDays(30),
                'status' => 'published',
                'created_by' => $admin->id,
                'published_at' => now(),
            ],
            [
                'title' => 'Frontend Developer',
                'company_name' => 'StartupXYZ',
                'location' => 'San Francisco, CA',
                'employment_type' => 'full-time',
                'salary_min' => 90000,
                'salary_max' => 120000,
                'salary_currency' => 'USD',
                'description' => 'Join our fast-paced startup as a Frontend Developer.',
                'requirements' => '3+ years of React experience, CSS/SCSS, responsive design',
                'responsibilities' => 'Develop user interfaces, collaborate with designers, optimize performance',
                'benefits' => 'Equity, health insurance, catered lunches',
                'application_deadline' => now()->addDays(20),
                'status' => 'published',
                'created_by' => $recruiter->id,
                'published_at' => now(),
            ],
            [
                'title' => 'DevOps Engineer',
                'company_name' => 'CloudTech Solutions',
                'location' => 'New York, NY',
                'employment_type' => 'full-time',
                'salary_min' => 110000,
                'salary_max' => 140000,
                'salary_currency' => 'USD',
                'description' => 'We need a DevOps Engineer to manage our cloud infrastructure.',
                'requirements' => 'Experience with AWS, Docker, Kubernetes, CI/CD pipelines',
                'responsibilities' => 'Manage infrastructure, automate deployments, monitor systems',
                'benefits' => 'Competitive salary, health insurance, professional development',
                'application_deadline' => now()->addDays(25),
                'status' => 'published',
                'created_by' => $admin->id,
                'published_at' => now(),
            ],
            [
                'title' => 'Junior Backend Developer',
                'company_name' => 'WebDev Agency',
                'location' => 'Austin, TX',
                'employment_type' => 'full-time',
                'salary_min' => 60000,
                'salary_max' => 80000,
                'salary_currency' => 'USD',
                'description' => 'Great opportunity for a junior developer to learn and grow.',
                'requirements' => '1-2 years of experience with Python or Node.js, database knowledge',
                'responsibilities' => 'Build API endpoints, write tests, maintain documentation',
                'benefits' => 'Mentorship program, health insurance, flexible hours',
                'application_deadline' => now()->addDays(15),
                'status' => 'draft',
                'created_by' => $recruiter->id,
            ],
            [
                'title' => 'UX/UI Designer',
                'company_name' => 'DesignHub',
                'location' => 'Los Angeles, CA',
                'employment_type' => 'contract',
                'salary_min' => 80000,
                'salary_max' => 100000,
                'salary_currency' => 'USD',
                'description' => '6-month contract for an experienced UX/UI Designer.',
                'requirements' => 'Portfolio required, Figma proficiency, user research experience',
                'responsibilities' => 'Design user interfaces, conduct user research, create prototypes',
                'application_deadline' => now()->addDays(10),
                'status' => 'closed',
                'created_by' => $admin->id,
                'published_at' => now()->subDays(5),
            ],
        ];

        foreach ($recruitments as $recruitmentData) {
            $recruitment = Recruitment::create($recruitmentData);

            if ($recruitment->status === 'published') {
                for ($i = 0; $i < rand(2, 5); $i++) {
                    Application::create([
                        'recruitment_id' => $recruitment->id,
                        'applicant_name' => fake()->name(),
                        'applicant_email' => fake()->unique()->email(),
                        'applicant_phone' => fake()->phoneNumber(),
                        'resume_path' => '/resumes/' . fake()->uuid() . '.pdf',
                        'cover_letter' => fake()->paragraph(3),
                        'status' => fake()->randomElement(['pending', 'reviewing', 'shortlisted']),
                        'applied_at' => now()->subDays(rand(1, 10)),
                    ]);
                }
            }
        }
    }
}
