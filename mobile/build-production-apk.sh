#!/bin/bash

echo "🏗️  Building Standalone Android APK..."
echo ""

cd "$(dirname "$0")"

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf android

# Prebuild with existing packages (don't modify package.json)
echo "📱 Creating Android native project..."
EXPO_NO_DEV_CLIENT=1 npx expo prebuild --platform android --clean << EOF
yes
EOF

if [ ! -d "android" ]; then
    echo "❌ Prebuild failed"
    exit 1
fi

# Build debug APK (more reliable than release)
echo "🔨 Building APK..."
cd android
./gradlew assembleDebug --no-daemon --max-workers=2 -x lint

# Check result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp app/build/outputs/apk/debug/app-debug.apk ../dairy-farm.apk
    echo ""
    echo "✅ SUCCESS! APK ready: dairy-farm.apk"
    echo "📊 Size: $(ls -lh ../dairy-farm.apk | awk '{print $5}')"
    echo ""
    echo "📱 To install:"
    echo "   1. Transfer dairy-farm.apk to your Android phone"
    echo "   2. Open and install (enable 'Unknown Sources' if needed)"
    echo "   OR use: adb install dairy-farm.apk"
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
