# Build APK Locally - Setup Guide

## Prerequisites Installation

### 1. Install Java Development Kit (JDK)
```bash
# Install OpenJDK 17 using Homebrew
brew install openjdk@17

# Add to your shell profile (~/.zshrc or ~/.bash_profile)
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
```

### 2. Install Android Command Line Tools
```bash
# Create Android SDK directory
mkdir -p ~/Library/Android/sdk

# Download command line tools from:
# https://developer.android.com/studio#command-tools
# Or use this direct link for macOS:
cd ~/Downloads
curl -o commandlinetools-mac.zip https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip

# Extract to SDK directory
unzip commandlinetools-mac.zip -d ~/Library/Android/sdk/
mkdir -p ~/Library/Android/sdk/cmdline-tools
mv ~/Library/Android/sdk/cmdline-tools ~/Library/Android/sdk/cmdline-tools/latest

# Add to shell profile
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
source ~/.zshrc
```

### 3. Install Android SDK Components
```bash
# Accept licenses
yes | sdkmanager --licenses

# Install required SDK components
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;25.1.8937393" "cmake;3.22.1"
```

### 4. Verify Setup
```bash
# Check Android SDK
sdkmanager --list_installed

# Check environment variables
echo $ANDROID_HOME
echo $JAVA_HOME
```

## Building the APK

### Option 1: Debug APK (Faster, for testing)
```bash
cd /Users/asadmakram/Desktop/farm-management/mobile

# Generate native android folder if not exists
npx expo prebuild --platform android

# Build debug APK
cd android
./gradlew assembleDebug

# APK location:
# android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Release APK (Production-ready)
```bash
cd /Users/asadmakram/Desktop/farm-management/mobile

# Generate native android folder if not exists
npx expo prebuild --platform android

# Build release APK
cd android
./gradlew assembleRelease

# APK location:
# android/app/build/outputs/apk/release/app-release.apk
```

## Quick Build Script

Create a script for easy building:

```bash
# Create build script
cat > build-apk.sh << 'EOF'
#!/bin/bash

echo "Building APK locally..."

# Ensure android folder exists
if [ ! -d "android" ]; then
  echo "Creating android native project..."
  npx expo prebuild --platform android
fi

# Navigate to android folder
cd android

# Build debug APK (faster)
echo "Building debug APK..."
./gradlew assembleDebug

# Copy APK to root for easy access
cp app/build/outputs/apk/debug/app-debug.apk ../dairy-farm-debug.apk

echo ""
echo "✅ Build complete!"
echo "📱 APK location: dairy-farm-debug.apk"
echo ""
EOF

# Make executable
chmod +x build-apk.sh

# Run it
./build-apk.sh
```

## Troubleshooting

### Error: ANDROID_HOME not set
```bash
source ~/.zshrc
echo $ANDROID_HOME
```

### Error: sdkmanager not found
```bash
# Verify path
ls ~/Library/Android/sdk/cmdline-tools/latest/bin/sdkmanager

# Re-add to PATH
export PATH=$PATH:$HOME/Library/Android/sdk/cmdline-tools/latest/bin
```

### Error: Gradle build fails
```bash
# Clean gradle cache
cd android
./gradlew clean

# Retry build
./gradlew assembleDebug --info
```

## Installing APK on Device

### Via USB (ADB)
```bash
# Enable USB debugging on your Android device
# Settings > Developer Options > USB Debugging

# Install APK
adb install dairy-farm-debug.apk
```

### Via File Transfer
1. Copy `dairy-farm-debug.apk` to your phone
2. Open file on Android device
3. Allow "Install from Unknown Sources"
4. Install the app
