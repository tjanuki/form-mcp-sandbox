<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authorization Request</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .card {
            background: white;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            max-width: 420px;
            width: 100%;
            padding: 40px;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { font-size: 24px; color: #1a202c; margin-bottom: 8px; }
        .header p { color: #718096; font-size: 14px; }
        .client-name {
            font-weight: 600;
            color: #667eea;
            font-size: 18px;
            text-align: center;
            padding: 16px;
            background: #f7fafc;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        .scopes { margin-bottom: 24px; }
        .scopes-title { font-size: 14px; color: #4a5568; margin-bottom: 12px; font-weight: 500; }
        .scope-item {
            display: flex;
            align-items: center;
            padding: 10px 0;
            border-bottom: 1px solid #e2e8f0;
        }
        .scope-item:last-child { border-bottom: none; }
        .scope-check { color: #48bb78; margin-right: 12px; }
        .scope-text { color: #2d3748; font-size: 14px; }
        .buttons { display: flex; gap: 12px; }
        .btn {
            flex: 1;
            padding: 14px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
        }
        .btn-approve {
            background: #667eea;
            color: white;
        }
        .btn-approve:hover { background: #5a67d8; }
        .btn-deny {
            background: #e2e8f0;
            color: #4a5568;
        }
        .btn-deny:hover { background: #cbd5e0; }
        .user-info {
            text-align: center;
            margin-bottom: 24px;
            padding: 12px;
            background: #f0fff4;
            border-radius: 8px;
            color: #276749;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="card">
        <div class="header">
            <h1>Authorization Request</h1>
            <p>An application is requesting access to your account</p>
        </div>

        <div class="user-info">
            Logged in as <strong>{{ auth()->user()->email }}</strong>
        </div>

        <div class="client-name">
            {{ $client->name }}
        </div>

        @if (count($scopes) > 0)
            <div class="scopes">
                <div class="scopes-title">This application will be able to:</div>
                @foreach ($scopes as $scope)
                    <div class="scope-item">
                        <span class="scope-check">&#10003;</span>
                        <span class="scope-text">{{ $scope->description }}</span>
                    </div>
                @endforeach
            </div>
        @endif

        <div class="buttons">
            <form method="POST" action="{{ route('passport.authorizations.deny') }}" style="flex: 1;">
                @csrf
                <input type="hidden" name="state" value="{{ $request->state }}">
                <input type="hidden" name="client_id" value="{{ $client->getKey() }}">
                <input type="hidden" name="auth_token" value="{{ $authToken }}">
                <button type="submit" class="btn btn-deny" style="width: 100%;">Cancel</button>
            </form>

            <form method="POST" action="{{ route('passport.authorizations.approve') }}" style="flex: 1;">
                @csrf
                <input type="hidden" name="state" value="{{ $request->state }}">
                <input type="hidden" name="client_id" value="{{ $client->getKey() }}">
                <input type="hidden" name="auth_token" value="{{ $authToken }}">
                <button type="submit" class="btn btn-approve" style="width: 100%;">Authorize</button>
            </form>
        </div>
    </div>
</body>
</html>
