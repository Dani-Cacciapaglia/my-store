#!/bin/bash

# Quick Setup Script for Google Calendar Integration
# This script helps you get started quickly

echo ""
echo "🚀 Google Calendar Integration - Quick Setup"
echo "==========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file exists"
fi

echo ""
echo "📋 Current .env status:"
echo ""

# Check each required variable
check_var() {
    local var_name=$1
    local value=$(grep "^${var_name}=" .env | cut -d'=' -f2-)

    if [ -z "$value" ] || [[ "$value" == *"your_"* ]]; then
        echo "❌ $var_name: NEEDS CONFIGURATION"
        return 1
    else
        echo "✓  $var_name: CONFIGURED"
        return 0
    fi
}

CLIENT_ID_OK=0
CLIENT_SECRET_OK=0
ACCESS_TOKEN_OK=0
REFRESH_TOKEN_OK=0

check_var "GOOGLE_CLIENT_ID" && CLIENT_ID_OK=1
check_var "GOOGLE_CLIENT_SECRET" && CLIENT_SECRET_OK=1
check_var "GOOGLE_ACCESS_TOKEN" && ACCESS_TOKEN_OK=1
check_var "GOOGLE_REFRESH_TOKEN" && REFRESH_TOKEN_OK=1

echo ""
echo "🎯 Next Steps:"
echo ""

if [ $CLIENT_ID_OK -eq 0 ] || [ $CLIENT_SECRET_OK -eq 0 ]; then
    echo "1️⃣  GET GOOGLE CREDENTIALS:"
    echo "   • Visit: https://console.cloud.google.com/"
    echo "   • Create a project or select existing"
    echo "   • Enable Google Calendar API"
    echo "   • Create OAuth 2.0 Client ID (Web application)"
    echo "   • Set redirect URI: http://localhost:3000/auth/google/callback"
    echo "   • Copy Client ID and Client Secret to .env"
    echo ""
fi

if [ $ACCESS_TOKEN_OK -eq 0 ] || [ $REFRESH_TOKEN_OK -eq 0 ]; then
    echo "2️⃣  GET ACCESS TOKENS:"
    echo "   • Run: npm start"
    echo "   • Visit: http://localhost:3000/auth.html"
    echo "   • Click 'Authorize with Google'"
    echo "   • Sign in and grant permissions"
    echo "   • Copy tokens from success page to .env"
    echo ""
fi

echo "3️⃣  TEST INTEGRATION:"
echo "   • Restart server: npm start"
echo "   • Visit: http://localhost:3000/availability.html"
echo "   • Check console for: ✓ Loaded from Google Calendar"
echo ""

if [ $CLIENT_ID_OK -eq 1 ] && [ $CLIENT_SECRET_OK -eq 1 ] && [ $ACCESS_TOKEN_OK -eq 1 ] && [ $REFRESH_TOKEN_OK -eq 1 ]; then
    echo "✅ SETUP COMPLETE! Ready to start server."
    echo ""
    echo "Run: npm start"
else
    echo "⚠️  SETUP INCOMPLETE - Follow steps above first."
fi

echo ""
