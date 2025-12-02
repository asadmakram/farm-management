#!/bin/bash

echo "🏗️  Building Android APK (Production Mode)..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Complete cleanup
echo "🧹 Removing all build artifacts..."
rm -rf android
rm -rf .expo
rm -rf node_modules/.cache
rm -rf android/.gradle 2>/dev/null

# Backup package.json
echo "📦 Preparing for production build..."
cp package.json package.json.backup

# Remove expo-dev-client from package.json using node
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json')); delete pkg.dependencies['expo-dev-client']; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

# Install dependencies without expo-dev-client
echo "📥 Installing dependencies..."
npm install

# Create fresh Android project
echo "📱 Creating Android native project..."
npx expo prebuild --platform android --clean

# Restore original package.json
echo "🔄 Restoring package.json..."
mv package.json.backup package.json

# Navigate to android folder
cd android

# Build release APK (unsigned) with optimizations for memory
echo "🔨 Building release APK..."
./gradlew assembleRelease -x lintVitalAnalyzeRelease -x lintVitalReportRelease --max-workers=2 --warning-mode=none

# Check if build succeeded
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    # Copy APK to root for easy access
    cp app/build/outputs/apk/release/app-release.apk ../dairy-farm-release.apk
    
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK Location:"
    echo "   $(pwd)/../dairy-farm-release.apk"
    echo ""
    echo "📊 APK Size:"
    ls -lh ../dairy-farm-release.apk | awk '{print "   " $5}'
    echo ""
    echo "💡 To install on your device:"
    echo "   1. Transfer dairy-farm-release.apk to your Android phone"
    echo "   2. Open the file and allow installation from unknown sources"
    echo "   OR"
    echo "   adb install dairy-farm-release.apk"
    echo ""
    
    cd ..
    echo ""
    echo "✅ Done! Your standalone APK is ready."
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    echo "Check the error messages above."
    echo ""
    cd ..
    exit 1
fi
