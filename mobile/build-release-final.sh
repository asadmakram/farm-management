#!/bin/bash

echo "🏗️  Building Production Release APK..."
echo "⏰ This will take 10-15 minutes - please be patient!"
echo ""

cd "$(dirname "$0")/android"

# Build release for ARM only (skips x86 to avoid issues)
echo "📱 Building for ARM64 and ARMv7..."
echo "   (Works on 99% of Android devices)"
echo ""

NODE_ENV=production ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a

# Check result
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    # Copy to root with proper name
    cp app/build/outputs/apk/release/app-release.apk ../DairyFarmManager-v1.0.apk
    
    echo ""
    echo "✅ SUCCESS! Release APK created!"
    echo ""
    echo "📦 APK Location:"
    echo "   $(pwd)/../DairyFarmManager-v1.0.apk"
    echo ""
    echo "📊 Size: $(ls -lh ../DairyFarmManager-v1.0.apk | awk '{print $5}')"
    echo ""
    echo "📱 To install:"
    echo "   1. Transfer to your Android device"
    echo "   2. Enable 'Install from Unknown Sources'"
    echo "   3. Open and install the APK"
    echo ""
    echo "✨ This is a production-ready standalone build!"
    echo ""
else
    echo "❌ Build failed - check errors above"
    exit 1
fi
