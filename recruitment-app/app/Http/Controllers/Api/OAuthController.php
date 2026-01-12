<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Laravel\Passport\TokenRepository;
use Laravel\Passport\Token;

class OAuthController extends Controller
{
    public function __construct(
        protected TokenRepository $tokenRepository
    ) {}

    /**
     * Introspect an access token and return user info if valid.
     * This endpoint is used by the MCP server to validate tokens.
     */
    public function introspect(Request $request): JsonResponse
    {
        $request->validate([
            'token' => 'required|string',
        ]);

        $tokenValue = $request->input('token');

        // Try to find the token in the database
        // Passport stores the token ID in the JWT, we need to parse it
        try {
            // Parse the JWT to get the token ID
            $tokenParts = explode('.', $tokenValue);
            if (count($tokenParts) !== 3) {
                return $this->inactiveTokenResponse();
            }

            $payload = json_decode(base64_decode($tokenParts[1]), true);
            if (!$payload || !isset($payload['jti'])) {
                return $this->inactiveTokenResponse();
            }

            $tokenId = $payload['jti'];
            $token = Token::find($tokenId);

            if (!$token) {
                return $this->inactiveTokenResponse();
            }

            // Check if token is revoked or expired
            if ($token->revoked) {
                return $this->inactiveTokenResponse();
            }

            if ($token->expires_at && $token->expires_at->isPast()) {
                return $this->inactiveTokenResponse();
            }

            // Get the user associated with the token
            $user = $token->user;

            if (!$user) {
                return $this->inactiveTokenResponse();
            }

            return response()->json([
                'active' => true,
                'user_id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role ?? 'viewer',
                'scope' => $token->scopes ?? [],
                'client_id' => $token->client_id,
                'exp' => $token->expires_at?->timestamp,
            ]);
        } catch (\Exception $e) {
            return $this->inactiveTokenResponse();
        }
    }

    /**
     * Return the authenticated user's profile.
     * This endpoint requires a valid access token via auth:api middleware.
     */
    public function userinfo(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'sub' => (string) $user->id,
            'user_id' => $user->id,
            'email' => $user->email,
            'name' => $user->name,
            'role' => $user->role ?? 'viewer',
            'email_verified' => $user->email_verified_at !== null,
        ]);
    }

    protected function inactiveTokenResponse(): JsonResponse
    {
        return response()->json([
            'active' => false,
        ]);
    }
}
