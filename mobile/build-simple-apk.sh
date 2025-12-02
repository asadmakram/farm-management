#!/bin/bash

echo "🏗️  Building Android APK (Simple Debug Build)..."
echo ""

cd "$(dirname "$0")"

# Stop any gradle daemons
echo "🛑 Stopping Gradle daemons..."
cd android 2>/dev/null && ./gradlew --stop 2>/dev/null
cd ..

# Complete clean
echo "🧹 Cleaning everything..."
rm -rf android
rm -rf node_modules/.cache

# Just remove expo-dev-client temporarily WITHOUT reinstalling everything
echo "📦 Preparing for production build..."
cp package.json package.json.backup
node -e "const fs=require('fs');const p=JSON.parse(fs.readFileSync('package.json'));delete p.dependencies['expo-dev-client'];fs.writeFileSync('package.json',JSON.stringify(p,null,2));"

# Prebuild Android
echo "📱 Creating Android project..."
echo "yes" | npx expo prebuild --platform android --clean

# Check if prebuild succeeded
if [ ! -d "android" ]; then
    echo "❌ Prebuild failed - android folder not created"
    mv package.json.backup package.json 2>/dev/null
    exit 1
fi

# Restore package.json
mv package.json.backup package.json

# Build debug APK (much more reliable than release)
echo "🔨 Building debug APK..."
cd android
./gradlew assembleDebug --no-daemon --max-workers=2

# Check result
if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
    cp app/build/outputs/apk/debug/app-debug.apk ../dairy-farm.apk
    echo ""
    echo "✅ SUCCESS! APK created: dairy-farm.apk"
    echo "📊 Size: $(ls -lh ../dairy-farm.apk | awk '{print $5}')"
    echo ""
    echo "📱 Install with: adb install dairy-farm.apk"
    echo "   Or transfer to your phone and install manually"
else
    echo "❌ Build failed"
    exit 1
fi
