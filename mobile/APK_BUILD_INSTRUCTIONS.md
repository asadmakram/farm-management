# Building Production APK for Dairy Farm Manager

## Option 1: Use Expo EAS Build (Cloud) - RECOMMENDED ✅

This is the most reliable method as Expo handles all the native compilation complexity.

### Steps:

1. **Login to Expo** (if not already):
   ```bash
   cd /Users/asadmakram/Desktop/farm-management/mobile
   npx eas login
   ```

2. **Build APK**:
   ```bash
   npx eas build --profile production --platform android
   ```

3. **Download APK**:
   - Build will run in the cloud (takes ~10-15 minutes)
   - You'll get a download link when complete
   - Or download from: https://expo.dev/accounts/[your-account]/projects/mobile/builds

### Advantages:
- ✅ Handles all CMake and native compilation issues
- ✅ Proper code signing with managed credentials
- ✅ Optimized production build
- ✅ No local setup required
- ✅ Free for open source projects

---

## Option 2: Fix Local Build Issues

The local build is failing because:
1. **CMake hangs** on x86/x86_64 architecture compilation
2. **New Architecture** required by react-native-reanimated causes issues
3. **Memory issues** during native module compilation

### To fix (if you must build locally):

1. **Increase system resources**:
   - Close other applications
   - Ensure at least 8GB free RAM

2. **Build with timeout and retries**:
   ```bash
   cd /Users/asadmakram/Desktop/farm-management/mobile/android
   
   # Set max build time to 30 minutes
   ./gradlew assembleRelease \
     -PreactNativeArchitectures=arm64-v8a \
     --no-daemon \
     --max-workers=2 \
     -Dorg.gradle.jvmargs="-Xmx6g -XX:MaxMetaspaceSize=2g"
   ```

3. **If still fails**, remove problematic dependencies:
   - Consider removing `react-native-reanimated` and `react-native-worklets`
   - These require new architecture and cause CMake issues

---

## Current Status

✅ **Debug APK available**: `android/app/build/outputs/apk/debug/app-debug.apk` (189MB)
- This APK works for testing but is not optimized
- JavaScript bundle is included
- Can be installed on devices

❌ **Release APK**: Failed to build due to CMake configuration issues

---

## Quick Solution: Use Debug APK for Now

```bash
cd /Users/asadmakram/Desktop/farm-management/mobile
cp android/app/build/outputs/apk/debug/app-debug.apk ./DairyFarmManager.apk
```

Then transfer `DairyFarmManager.apk` to your Android device and install.

---

## Recommended Next Steps:

1. **Use EAS Build** (cloud) - Most reliable
2. **Or** use the existing debug APK for testing
3. **Or** wait for Android Build to complete (if still running in background)

The EAS cloud build is strongly recommended as it eliminates all local compilation issues.
