<?php

namespace App\Http\Responses;

use Illuminate\Contracts\Support\Responsable;
use Laravel\Passport\Contracts\AuthorizationViewResponse as AuthorizationViewResponseContract;

class AuthorizationViewResponse implements AuthorizationViewResponseContract
{
    protected array $parameters = [];

    public function withParameters(array $parameters = []): static
    {
        $this->parameters = $parameters;

        return $this;
    }

    public function toResponse($request)
    {
        return response()->view('passport.authorize', $this->parameters);
    }
}
