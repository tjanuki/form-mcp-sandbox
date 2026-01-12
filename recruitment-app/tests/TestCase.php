<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Laravel\Passport\Client;
use Laravel\Passport\Passport;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Set up Passport for testing if using RefreshDatabase
        if (in_array(\Illuminate\Foundation\Testing\RefreshDatabase::class, class_uses_recursive($this))) {
            $this->setUpPassport();
        }
    }

    protected function setUpPassport(): void
    {
        // Create a personal access client for testing using raw DB insert
        // In Passport v13, personal_access is indicated by grant_types column
        $clientId = (string) \Illuminate\Support\Str::uuid();

        \DB::table('oauth_clients')->insert([
            'id' => $clientId,
            'name' => 'Test Personal Access Client',
            'secret' => null,
            'redirect_uris' => json_encode(['http://localhost']),
            'grant_types' => json_encode(['personal_access']),
            'revoked' => false,
            'provider' => 'users',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
