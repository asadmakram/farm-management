#!/bin/bash

echo "🏗️  Building Android APK locally..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

# Ensure android folder exists
if [ ! -d "android" ]; then
  echo "📱 Creating Android native project..."
  npx expo prebuild --platform android --clean
  echo ""
fi

# Navigate to android folder
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build debug APK
echo "🔨 Building debug APK..."
./gradlew assembleDebug --warning-mode=none

# Check if build succeeded
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    # Copy APK to root for easy access
    cp app/build/outputs/apk/debug/app-debug.apk ../dairy-farm-debug.apk
    
    echo ""
    echo "✅ Build successful!"
    echo ""
    echo "📱 APK Location:"
    echo "   $(pwd)/../dairy-farm-debug.apk"
    echo ""
    echo "📊 APK Size:"
    ls -lh ../dairy-farm-debug.apk | awk '{print "   " $5}'
    echo ""
    echo "💡 To install on your device:"
    echo "   1. Transfer dairy-farm-debug.apk to your Android phone"
    echo "   2. Open the file and allow installation"
    echo "   OR"
    echo "   adb install dairy-farm-debug.apk"
    echo ""
else
    echo ""
    echo "❌ Build failed!"
    echo "Check the error messages above."
    echo ""
    exit 1
fi
