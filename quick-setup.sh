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

check_var "GOOGLE_CLIENT_ID" && CLIENT_ID_OK=1
check_var "GOOGLE_CLIENT_SECRET" && CLIENT_SECRET_OK=1

echo ""
echo "🎯 Next Steps:"
echo ""

if [ $CLIENT_ID_OK -eq 0 ] || [ $CLIENT_SECRET_OK -eq 0 ]; then
    echo "1️⃣  GET GOOGLE CREDENTIALS:"
    echo "   • Visit: https://console.cloud.google.com/"
    echo "   • Create a project or select existing"
    echo "   • Enable Google Calendar API"
    echo "   • Create OAuth 2.0 Client ID (Web application)"
    echo "   • Set redirect URI: http://localhost:8787/auth/google/callback"
    echo "   • Copy Client ID and Client Secret to .env"
    echo ""
fi

if [ $CLIENT_ID_OK -eq 1 ] && [ $CLIENT_SECRET_OK -eq 1 ]; then
    echo "2️⃣  AUTHORIZE GOOGLE CALENDAR:"
    echo "   • Run: npm run dev"
    echo "   • Visit: http://localhost:8787/auth/google"
    echo "   • Sign in and grant read-only calendar permission"
    echo ""
fi

echo "3️⃣  TEST INTEGRATION:"
echo "   • Start the Worker: npm run dev"
echo "   • Visit: http://localhost:8787/availability.html"
echo "   • Check console for: ✓ Loaded from Google Calendar"
echo ""

if [ $CLIENT_ID_OK -eq 1 ] && [ $CLIENT_SECRET_OK -eq 1 ]; then
    echo "✅ SETUP COMPLETE! Ready to start the Worker."
    echo ""
    echo "Run: npm run dev"
else
    echo "⚠️  SETUP INCOMPLETE - Follow steps above first."
fi

echo ""
