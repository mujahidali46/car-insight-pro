#!/bin/bash
# Car Insight Pro - Android APK Build Automation Helper Script
# This script can be executed on any environment with Node.js, Java SDK 17+, and Android Command Line Tools/SDK installed.

echo "========================================="
echo "   Car Insight Pro APK Build Automator"
echo "========================================="

# 1. Verification
if ! command -v npm &> /dev/null; then
    echo "[-] Error: 'npm' is required but not found in runtime PATH. Please install Node.js."
    exit 1
fi

# 2. Build Web Production Bundle
echo "[+] Bundling web app using Vite..."
npm install
npm run build

# 3. Initialize & Configure Capacitor
echo "[+] Integrating Capacitor Android Native bridge..."
npm install @capacitor/core @capacitor/cli

if [ ! -d "android" ]; then
    echo "[+] Adding Android platform scaffolding..."
    npx cap init "Car Insight Pro" "com.carinsight.pro" --web-dir=dist
    npm install @capacitor/android
    npx cap add android
else
    echo "[~] Android platform already exists. Syncing web changes..."
fi

# 4. Sync web bundle to Android asset stream
echo "[+] Syncing build directories to native assets..."
npx cap sync android

# 5. Compile APK via Gradle Wrapper
if [ -f "android/gradlew" ]; then
    echo "[+] Running Android Gradle Compiler..."
    cd android
    # Grant permissions to Gradle Wrapper
    chmod +x gradlew
    # Build a debug APK
    ./gradlew assembleDebug
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=========================================================================="
        echo "[+] Success! Android APK compiled successfully."
        echo "[+] APK Location: android/app/build/outputs/apk/debug/app-debug.apk"
        echo "=========================================================================="
    else
        echo "[-] Error: Gradle build failed. Check that ANDROID_HOME and Java JDK 17+ are set up correctly."
        exit 1
    fi
else
    echo "[-] Error: Capacitor Android app initialized, but Gradle wrapper is missing."
    echo "[i] You can open the 'android' folder in Android Studio and click Build -> Build APK."
    exit 1
fi
