#!/bin/bash
# Quick start script for Google Calendar integration

echo "🚀 My Store - Google Calendar Integration"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js detected: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env with your Google Calendar API credentials"
    echo "   See GOOGLE_CALENDAR_SETUP.md for detailed instructions"
    echo ""
else
    echo "✓ .env file exists"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
else
    echo "✓ Dependencies already installed"
fi

echo "🎉 Ready to start!"
echo ""
echo "Next steps:"
echo "1. Follow the setup guide: GOOGLE_CALENDAR_SETUP.md"
echo "2. Update your .env file with Google API credentials"
echo "3. Run: npm run dev"
echo "4. Visit: http://localhost:8787/auth/google to authorize"
echo ""
