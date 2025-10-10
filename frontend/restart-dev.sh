#!/bin/bash
# Restart Next.js dev server with clean cache

echo "🧹 Cleaning Next.js cache..."
rm -rf .next

echo "📦 Clearing node_modules cache..."
rm -rf node_modules/.cache

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting dev server..."
echo "   Frontend will be at: http://localhost:3000"
echo "   API URL: http://localhost:5000"
echo ""
npm run dev
