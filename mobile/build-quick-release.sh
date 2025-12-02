#!/bin/bash

echo "🔨 Building Release APK (Simplified)"
echo ""

cd "$(dirname "$0")/android"

# Build release APK directly
echo "Building..."
./gradlew :app:assembleRelease \
  -x lint \
  -x lintVitalAnalyzeRelease \
  -x lintVitalReportRelease \
  --configure-on-demand \
  --parallel \
  --max-workers=4

if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    cp app/build/outputs/apk/release/app-release.apk ../DairyFarm-Release.apk
    echo ""
    echo "✅ APK Ready: DairyFarm-Release.apk"
    ls -lh ../DairyFarm-Release.apk
else
    echo "❌ Failed"
    exit 1
fi
