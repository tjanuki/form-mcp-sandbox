<?php

namespace Tests\Feature;

use App\Models\Recruitment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Passport\Passport;
use Tests\TestCase;

class RecruitmentApiTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $recruiter;
    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->recruiter = User::factory()->create(['role' => 'recruiter']);
        $this->viewer = User::factory()->create(['role' => 'viewer']);
    }

    public function test_authenticated_user_can_list_recruitments(): void
    {
        Recruitment::factory()->count(3)->create(['created_by' => $this->admin->id]);

        Passport::actingAs($this->admin);
        $response = $this->getJson('/api/recruitments');

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

        Passport::actingAs($this->admin);
        $response = $this->postJson('/api/recruitments', $data);

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

        Passport::actingAs($this->recruiter);
        $response = $this->postJson('/api/recruitments', $data);

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

        Passport::actingAs($this->viewer);
        $response = $this->postJson('/api/recruitments', $data);

        $response->assertStatus(403);
    }

    public function test_creator_can_update_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create(['created_by' => $this->recruiter->id]);

        Passport::actingAs($this->recruiter);
        $response = $this->putJson("/api/recruitments/{$recruitment->id}", [
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

        Passport::actingAs($this->recruiter);
        $response = $this->putJson("/api/recruitments/{$recruitment->id}", [
            'title' => 'Hacked Title',
        ]);

        $response->assertStatus(403);
    }

    public function test_creator_can_delete_recruitment(): void
    {
        $recruitment = Recruitment::factory()->create(['created_by' => $this->recruiter->id]);

        Passport::actingAs($this->recruiter);
        $response = $this->deleteJson("/api/recruitments/{$recruitment->id}");

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

        Passport::actingAs($this->recruiter);
        $response = $this->patchJson("/api/recruitments/{$recruitment->id}/publish");

        $response->assertStatus(200)
            ->assertJsonFragment(['status' => 'published']);

        $this->assertDatabaseHas('recruitments', [
            'id' => $recruitment->id,
            'status' => 'published',
        ]);
    }

    public function test_duplicate_recruitment_returns_existing_within_60_seconds(): void
    {
        $data = [
            'title' => 'Duplicate Test Position',
            'company_name' => 'Test Corp',
            'location' => 'Remote',
            'employment_type' => 'full-time',
            'description' => 'Test description',
            'requirements' => 'Test requirements',
            'responsibilities' => 'Test responsibilities',
        ];

        Passport::actingAs($this->admin);

        // First request - should create
        $response1 = $this->postJson('/api/recruitments', $data);

        $response1->assertStatus(201);
        $createdId = $response1->json('data.id');

        // Second request with same data - should return existing (200, not 201)
        $response2 = $this->postJson('/api/recruitments', $data);

        $response2->assertStatus(200);
        $this->assertEquals($createdId, $response2->json('data.id'));

        // Only one record should exist
        $this->assertEquals(1, Recruitment::where('title', 'Duplicate Test Position')->count());
    }

    public function test_different_users_can_create_same_recruitment(): void
    {
        // Verify users have different IDs
        $this->assertNotEquals($this->admin->id, $this->recruiter->id);

        $data = [
            'title' => 'Same Position Different User',
            'company_name' => 'Company',
            'location' => 'Location',
            'employment_type' => 'full-time',
            'description' => 'Description',
            'requirements' => 'Requirements',
            'responsibilities' => 'Responsibilities',
        ];

        // Admin creates
        Passport::actingAs($this->admin);
        $response1 = $this->postJson('/api/recruitments', $data);
        $response1->assertStatus(201);

        $recruitment1 = Recruitment::first();
        $this->assertEquals($this->admin->id, $recruitment1->created_by);

        // Recruiter creates same - should be allowed (different user)
        Passport::actingAs($this->recruiter);
        $response2 = $this->postJson('/api/recruitments', $data);
        $response2->assertStatus(201);

        // Two records should exist
        $this->assertEquals(2, Recruitment::where('title', 'Same Position Different User')->count());
    }
}
