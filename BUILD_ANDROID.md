# Build Android APK

## Automated Build (Recommended)

GitHub Actions automatically builds the APK when you push to `main` branch:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Mobile optimization and Android APK setup"
   git push origin main
   ```

2. **Download APK:**
   - Go to GitHub repository → **Actions** tab
   - Find the latest "Build Android APK" workflow
   - Click it → **Artifacts** section
   - Download `app-debug.apk`

3. **Install on Android:**
   ```bash
   adb install app-debug.apk
   ```

---

## Manual Build (if needed)

### Prerequisites
- Node.js 16+
- Java Development Kit (JDK) 11+
- Android SDK
- Android Studio (recommended)

### Steps

1. **Setup frontend:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build React:**
   ```bash
   npm run build
   ```

3. **Install Capacitor:**
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   ```

4. **Initialize (if needed):**
   ```bash
   npx cap init "WP Bot CRM" "com.investigalo.wpbot" --web-dir=build
   ```

5. **Add Android platform:**
   ```bash
   npx cap add android
   ```

6. **Sync files:**
   ```bash
   npx cap sync
   ```

7. **Build APK:**
   ```bash
   cd android
   chmod +x ./gradlew
   ./gradlew assembleDebug
   ```

   APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Configuration for Backend

### For Local Testing
APK will connect to: `http://localhost:5000` by default

### For Production (Hetzner)
Update `.env` in frontend **before building**:
```
REACT_APP_API_URL=http://188.34.200.140:5000
```

Then rebuild:
```bash
npm run build
npx cap sync
```

---

## Troubleshooting

**"Could not find gradle"**
- Install Android SDK via Android Studio
- Set `ANDROID_SDK_ROOT` environment variable

**"Could not find Java"**
- Install JDK 11+
- Set `JAVA_HOME` environment variable

**APK not connecting to backend**
- Make sure backend is running on Hetzner
- Check firewall allows port 5000
- Update REACT_APP_API_URL before building

---

## Install APK on Android Device

```bash
# Via USB
adb install app-debug.apk

# Or transfer manually:
# 1. Copy APK to phone
# 2. Open file manager
# 3. Tap the APK file
# 4. Install
```

---

## Release Build (Production)

For production release on Google Play, create signed APK:

```bash
cd android
./gradlew assembleRelease
```

Requires signing configuration (see Android Studio docs)

