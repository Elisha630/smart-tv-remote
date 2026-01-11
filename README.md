# Android TV Remote

A web-based remote control for Android TV devices using ADB over network.

![Android TV Remote](preview.png)

## Features

- 🎯 **Trackpad** - Control mouse cursor on your TV
- 🎮 **D-Pad** - Navigate with directional buttons
- 🔊 **Volume & Channel** - Control audio and channels
- 📱 **Apps Panel** - View and launch installed apps
- 🔌 **Network Scanner** - Auto-discover Android TV devices
- ⌨️ **Keyboard Shortcuts** - Quick app launch with configurable shortcuts
- 📺 **Input/Menu** - Switch inputs and access TV settings

## Installation

### Option 1: Run as Web App (Linux/macOS/Windows)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Elisha630/smart-tv-remote.git
   cd smart-tv-remote
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build the app:**
   ```bash
   npm run build
   ```

4. **Serve locally:**
   ```bash
   npm run preview
   ```

5. **Run the ADB Bridge Server** (required):
   ```bash
   # Install Python dependencies
   pip install websockets
   
   # Run the bridge server
   python3 adb_bridge.py
   ```

6. Open `http://localhost:4173` in your browser

### Option 2: Build Android APK

1. **Prerequisites:**
   - Node.js 18+
   - Android Studio
   - Android SDK Platform Tools (for ADB)

2. **Clone and install:**
   ```bash
   git clone https://github.com/Elisha630/smart-tv-remote.git
   cd smart-tv-remote
   npm install
   ```

3. **Add Android platform:**
   ```bash
   npx cap add android
   ```

4. **Build the web app:**
   ```bash
   npm run build
   ```

5. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

6. **Open in Android Studio:**
   ```bash
   npx cap open android
   ```

7. **Build APK:**
   - In Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
   - Or from command line: `cd android && ./gradlew assembleDebug`

8. **Find your APK at:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

## Setup Your Android TV

1. **Enable Developer Options:**
   - Go to Settings → About → Build number
   - Tap "Build number" 7 times

2. **Enable ADB Debugging:**
   - Go to Settings → Developer Options
   - Enable "USB debugging"
   - Enable "ADB over network" (or similar option)

3. **Note the IP Address:**
   - Go to Settings → Network & Internet → Your network
   - Note down the IP address

4. **Ensure Same Network:**
   - Your phone/computer must be on the same WiFi network as the TV

## Usage

1. Start the ADB Bridge Server on your computer
2. Open the web app or Android app
3. Click the connection icon in the header
4. Click "Scan for devices" to find your TV
5. Select your device to connect
6. Use the remote controls!

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Arrow keys | Navigate D-pad |
| Enter | Select/OK |
| Escape/Backspace | Back |
| Home | Home button |
| Space | Play/Pause |
| Custom keys | Launch configured apps |

## Troubleshooting

### "Cannot connect to ADB bridge"
- Make sure `adb_bridge.py` is running
- Check that Python and websockets are installed
- Verify the bridge is running on `ws://localhost:8765`

### "No devices found"
- Ensure your TV has ADB over network enabled
- Check both devices are on the same network
- Try manually connecting: `adb connect <TV_IP>:5555`

### "Connection refused"
- The TV may require authorization - check the TV screen for a prompt
- Try disconnecting and reconnecting

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion
- **Mobile:** Capacitor (for Android APK)
- **Backend:** Python WebSocket server + ADB

## License

MIT
