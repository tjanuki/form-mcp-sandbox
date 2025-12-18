<?php

namespace Tests\Feature;

use App\Models\Recruitment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecruitmentApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $recruiter;
    protected User $viewer;
    protected string $adminToken;
    protected string $recruiterToken;
    protected string $viewerToken;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->recruiter = User::factory()->create(['role' => 'recruiter']);
        $this->viewer = User::factory()->create(['role' => 'viewer']);

        $this->adminToken = $this->admin->createToken('test')->plainTextToken;
        $this->recruiterToken = $this->recruiter->createToken('test')->plainTextToken;
        $this->viewerToken = $this->viewer->createToken('test')->plainTextToken;
    }

    public function test_authenticated_user_can_list_recruitments(): void
    {
        Recruitment::factory()->count(3)->create(['created_by' => $this->admin->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->getJson('/api/recruitments');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'title',
                        'company_name',
                        'location',
                        'employment_type',
                        'status',
                    ],
                ],
            ]);
    }

    public function test_unauthenticated_user_cannot_list_recruitments(): void
    {
        $response = $this->getJson('/api/recruitments');

        $response->assertStatus(401);
    }

    public function test_admin_can_create_recruitment(): void
    {
        $data = [
            'title' => 'Senior Developer',
            'company_name' => 'Tech Corp',
            'location' => 'Remote',
            'employment_type' => 'full-time',
            'salary_min' => 100000,
            'salary_max' => 150000,
            'description' => 'We are looking for a senior developer',
            'requirements' => '5+ years of experience',
            'responsibilities' => 'Lead development team',
            'status' => 'draft',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->adminToken}")
            ->postJson('/api/recruitments', $data);

        $response->assertStatus(201)
            ->assertJsonFragment(['title' => 'Senior Developer']);

        $this->assertDatabaseHas('recruitments', [
            'title' => 'Senior Developer',
            'created_by' => $this->admin->id,
        ]);
    }

    public function test_recruiter_can_create_recruitment(): void
    {
        $data = [
            'title' => 'Junior Developer',
            'company_name' => 'StartupXYZ',
            'location' => 'New York',
            'employment_type' => 'full-time',
            'description' => 'Great opportunity',
            'requirements' => '1-2 years experience',
            'responsibilities' => 'Write code',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->recruiterToken}")
            ->postJson('/api/recruitments', $data);

        $response->assertStatus(201);
    }

    public function test_viewer_cannot_create_recruitment(): void
    {
        $data = [
            'title' => 'Test Position',
            'company_name' => 'Company',
            'location' => 'Location',
            'employment_type' => 'full-time',
            'description' => 'Description',
            'requirements' => 'Requirements',
            'responsibilities' => 'Responsibilities',
        ];

        $response = $this->withHeader('Authorization', "Bearer {$this->viewerToken}")
            ->postJson('/api/recruitments', $data);

        $response->assertStatus(403);
    }

    public function test_creator_can_update_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create(['created_by' => $this->recruiter->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->recruiterToken}")
            ->putJson("/api/recruitments/{$recruitment->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200)
            ->assertJsonFragment(['title' => 'Updated Title']);

        $this->assertDatabaseHas('recruitments', [
            'id' => $recruitment->id,
            'title' => 'Updated Title',
        ]);
    }

    public function test_non_creator_cannot_update_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create(['created_by' => $this->admin->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->recruiterToken}")
            ->putJson("/api/recruitments/{$recruitment->id}", [
                'title' => 'Hacked Title',
            ]);

        $response->assertStatus(403);
    }

    public function test_creator_can_delete_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create(['created_by' => $this->recruiter->id]);

        $response = $this->withHeader('Authorization', "Bearer {$this->recruiterToken}")
            ->deleteJson("/api/recruitments/{$recruitment->id}");

        $response->assertStatus(200);

        $this->assertDatabaseMissing('recruitments', [
            'id' => $recruitment->id,
        ]);
    }

    public function test_creator_can_publish_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create([
            'created_by' => $this->recruiter->id,
            'status' => 'draft',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$this->recruiterToken}")
            ->patchJson("/api/recruitments/{$recruitment->id}/publish");

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'published']);

        $this->assertDatabaseHas('recruitments', [
            'id' => $recruitment->id,
            'status' => 'published',
        ]);
    }
}
