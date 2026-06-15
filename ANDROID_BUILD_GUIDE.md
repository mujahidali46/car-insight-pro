# Car Insight Pro: Android Deployment & APK Compiling Guide

Welcome to the **Car Insight Pro** Android architecture documentation. As a professional, offline-first vehicle diagnostics, live telemetry, and vehicle health monitoring platform, Car Insight Pro can be run on mobile interfaces through two distinct, premium pathways:
1. **Instant Progressive Web App (PWA) Deployment** (Zero-friction, fully sandboxed standalone installation).
2. **Capacitor Native APK Compilation** (Full Android Application Package container with Bluetooth/OBD-II communication capabilities).

---

## 🚀 Pathway 1: Instant PWA Mobile Installation (No Build Required)

Car Insight Pro is configured as a native-compliant **Progressive Web App**. Because of this, you and your clients can install and run the application instantly on any Android phone without distributing an APK:

### 📱 Android Installation Lifecycle
1. Connect your Android phone to the internet and open Google Chrome.
2. Navigate to the **Development App URL** or **Shared App URL**:
   * **Development URL**: `https://ais-dev-zmjsel73npvq4msu43efkj-995578042372.asia-southeast1.run.app`
   * **Shared URL**: `https://ais-pre-zmjsel73npvq4msu43efkj-995578042372.asia-southeast1.run.app`
3. Click on the 3-dot browser menu button in Google Chrome and tap **"Add to Home screen"** or look for the banner notification.
4. Car Insight Pro will be installed directly onto your Android device App Drawer with the **native maskable launcher icon** and high-contrast styling.

### ✨ Premium PWA Native Features Implemented:
* **Standalone Execution Window**: Launches in immersive full-screen mode, hiding the browser URL bar, tabs, and navigation chrome for a native app feel.
* **Service Worker Cache Cache-Aside Strategy (`sw.js`)**: Caches static assets, stylesheets, icons, and frameworks. The app loads and functions fully even when disconnected from cellular networks or deep inside a vehicle repair garage.
* **Performance Responsive Layout**: Optimized with specialized touch target sizes ($\ge 44$px) and high-refresh UI gauges tailored to vehicle dashboards.

---

## 🛠️ Pathway 2: Generating the Native APK (Client-Side Wrapper)

Because this web workspace executes within a virtualized, headless Cloud Run container, it lacks the host operating system dependencies (the **Android SDK and active Java Virtual Machine**) to physically run the Java/Kotlin compiler internally.

To generate your compiled APK, you have the custom build tools ready to run locally or in cloud workflows:

### A. One-Click Compile Script (`build-apk.sh`)
We have created an automated integration script at the root directory: **`build-apk.sh`**. 

Once you download the ZIP or clone the repository to your local machine (with Android SDK installed), simply execute:
```bash
chmod +x build-apk.sh
./build-apk.sh
```
This script will automatically:
1. Compile the React + Vite static production distribution into `/dist`.
2. Install Capacitor Core & CLI packages.
3. Automatically configure the Android manifest, gradle wrappers, and folder architecture.
4. Call Gradle to build a production-signed or debug APK located at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

---

### B. Manual Command Pipeline (Capacitor Flow)

If you prefer to compile manually in your Android Studio workspace, run the following commands sequentially at your local terminal:

```bash
# 1. Build the production React frontend structures
npm run build

# 2. Add the Capacitor native platform dependencies
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Initialize build configurations
npx cap init "Car Insight Pro" "com.carinsight.pro" --web-dir=dist

# 4. Inject the Android wrapper folder
npx cap add android

# 5. Copy the compiled web folders to the Android project structure
npx cap sync android

# 6. Boot Android Studio to run or sign compilation
npx cap open android
```

In Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**. The APK will be ready for sideloading or internal distribution.
