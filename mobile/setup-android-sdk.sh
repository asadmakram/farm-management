#!/bin/bash

echo "🚀 Setting up Android SDK for local APK builds..."
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "📦 Installing OpenJDK 17..."
    brew install openjdk@17
    
    echo "⚙️  Configuring Java..."
    echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
    echo 'export JAVA_HOME="/opt/homebrew/opt/openjdk@17"' >> ~/.zshrc
else
    echo "✅ Java already installed"
fi

# Create Android SDK directory
echo "📁 Creating Android SDK directory..."
mkdir -p ~/Library/Android/sdk

# Check if command line tools exist
if [ ! -d "$HOME/Library/Android/sdk/cmdline-tools/latest" ]; then
    echo "📥 Downloading Android Command Line Tools..."
    cd ~/Downloads
    
    # Download command line tools
    curl -L -o commandlinetools-mac.zip "https://dl.google.com/android/repository/commandlinetools-mac-11076708_latest.zip"
    
    echo "📦 Extracting command line tools..."
    unzip -q commandlinetools-mac.zip -d ~/Library/Android/sdk/
    
    # Organize directory structure
    mkdir -p ~/Library/Android/sdk/cmdline-tools
    mv ~/Library/Android/sdk/cmdline-tools ~/Library/Android/sdk/cmdline-tools/latest 2>/dev/null || true
    
    # Clean up
    rm commandlinetools-mac.zip
else
    echo "✅ Command line tools already installed"
fi

# Configure environment variables
echo "⚙️  Configuring environment variables..."
grep -q "ANDROID_HOME" ~/.zshrc || echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
grep -q "cmdline-tools/latest/bin" ~/.zshrc || echo 'export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.zshrc
grep -q "platform-tools" ~/.zshrc || echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
grep -q "emulator" ~/.zshrc || echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc

# Source the profile to apply changes
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools

echo "✅ Environment configured"

# Install SDK components
echo "📦 Installing Android SDK components (this may take a few minutes)..."
yes | $ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager --licenses 2>/dev/null

$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" "ndk;25.1.8937393" "cmake;3.22.1"

echo ""
echo "✅ Android SDK setup complete!"
echo ""
echo "🔄 Please run: source ~/.zshrc"
echo ""
echo "Then you can build your APK with:"
echo "  cd /Users/asadmakram/Desktop/farm-management/mobile"
echo "  ./build-apk.sh"
echo ""
