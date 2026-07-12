/**
 * 🔐 OAuth Authentication Handlers
 * Manages Google Calendar OAuth flow
 */

import { validateGoogleEnv, getCorsHeaders } from './utils.js';
import { initGoogleCalendar } from './utils.js';

/**
 * Handle /auth/google - Redirect to Google consent screen
 */
export async function handleGoogleAuth(request, env) {
  try {
    // Validate environment variables
    const validation = validateGoogleEnv(env);
    if (validation) {
      return new Response(
        JSON.stringify({ error: validation }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Initialize Google Calendar
    const { oauth2Client } = await initGoogleCalendar(env);

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar.readonly'],
      prompt: 'consent',
    });

    // Redirect to Google
    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
        ...getCorsHeaders(),
      },
    });

  } catch (error) {
    console.error('Auth URL generation failed:', error);
    return new Response(
      JSON.stringify({ error: 'OAuth configuration error', message: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(),
        },
      }
    );
  }
}

/**
 * Handle /auth/google/callback - Exchange code for tokens and store in KV
 */
export async function handleGoogleCallback(request, env) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      return new Response(
        getAuthErrorHtml(error),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Validate code
    if (!code) {
      return new Response(
        getAuthErrorHtml('No authorization code received'),
        {
          status: 400,
          headers: {
            'Content-Type': 'text/html',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Check if KV is available
    if (!env.TOKENS) {
      console.error('TOKENS KV namespace not configured');
      return new Response(
        getAuthErrorHtml('Server configuration error: KV storage not available'),
        {
          status: 500,
          headers: {
            'Content-Type': 'text/html',
            ...getCorsHeaders(),
          },
        }
      );
    }

    // Initialize Google Calendar
    const { oauth2Client } = await initGoogleCalendar(env);

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    // Store tokens in Cloudflare KV
    await env.TOKENS.put('access_token', tokens.access_token);
    await env.TOKENS.put('refresh_token', tokens.refresh_token);
    await env.TOKENS.put('tokens_set_at', new Date().toISOString());
    console.log('✓ Tokens stored in KV');

    // Return success page
    return new Response(
      getAuthSuccessHtml(true),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          ...getCorsHeaders(),
        },
      }
    );

  } catch (error) {
    console.error('Token exchange failed:', error);
    return new Response(
      getAuthErrorHtml(`Token exchange failed: ${error.message}`),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/html',
          ...getCorsHeaders(),
        },
      }
    );
  }
}

/**
 * Generate authorization success HTML
 */
function getAuthSuccessHtml(tokensStored) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authorization Success</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        h1 {
            color: #4CAF50;
            margin-top: 0;
            font-size: 28px;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .message {
            color: #333;
            font-size: 16px;
            line-height: 1.6;
            margin: 20px 0;
        }
        .info-box {
            background: #f0f7ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
        }
        .info-box strong {
            color: #2196F3;
        }
        a, button {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: #4CAF50;
            color: white;
            text-decoration: none;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }
        a:hover, button:hover {
            background: #45a049;
        }
        .secondary-link {
            display: block;
            margin-top: 15px;
            color: #2196F3;
            text-decoration: none;
            font-size: 14px;
        }
        .secondary-link:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✅</div>
        <h1>Authorization Successful!</h1>
        
        <div class="message">
            Your calendar is now connected and ready to use.
        </div>

        <div class="info-box">
            <strong>ℹ️ What's next:</strong><br>
            Your OAuth tokens have been automatically stored in Cloudflare KV. 
            The availability calendar is now synced with your Google Calendar.
        </div>

        <a href="/availability.html">Go to Your Calendar</a>
        <a class="secondary-link" href="/">Return to Home</a>
    </div>
</body>
</html>
  `;
}

/**
 * Generate authorization error HTML
 */
function getAuthErrorHtml(errorMessage) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Authorization Error</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            max-width: 600px;
            width: 90%;
            text-align: center;
        }
        h1 {
            color: #f5576c;
            margin-top: 0;
            font-size: 28px;
        }
        .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        .message {
            color: #333;
            font-size: 16px;
            line-height: 1.6;
            margin: 20px 0;
        }
        .error-detail {
            background: #fff3cd;
            border-left: 4px solid #ff9800;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
            border-radius: 4px;
            color: #666;
            font-family: monospace;
            font-size: 12px;
            overflow-x: auto;
        }
        a {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 30px;
            background: #2196F3;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            font-size: 16px;
            font-weight: bold;
            transition: background 0.3s;
        }
        a:hover {
            background: #1976D2;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">⚠️</div>
        <h1>Authorization Error</h1>
        
        <div class="message">
            There was a problem authorizing your Google account.
        </div>

        <div class="error-detail">
            ${errorMessage}
        </div>

        <a href="/auth">Try Again</a>
    </div>
</body>
</html>
  `;
}
