# App Icon Setup Guide

## ✅ Icons Integrated

Your app icons have been integrated into the project. Here's what was set up:

### Main Icons
- **`./assets/icon.png`** - Main app icon (1024x1024) used for:
  - iOS app icon (Expo generates all sizes automatically)
  - Android app icon (base)
  - Notification icon
  - Web favicon (if needed)

- **`./assets/adaptive-icon.png`** - Android adaptive icon foreground
  - Used for Android adaptive icons (Android 8.0+)
  - Background color: `#ffffff` (white)

### Store Icons (for manual upload)
- **`./assets/appstore-icon.png`** - For App Store Connect upload
- **`./assets/playstore-icon.png`** - For Google Play Console upload

## How Expo Handles Icons

### iOS
Expo automatically generates all required iOS icon sizes from the single 1024x1024 `icon.png` file:
- App icon (all sizes: 20pt, 29pt, 40pt, 60pt, 76pt, 83.5pt, etc.)
- Notification icons
- Settings icons
- Spotlight icons

### Android
Expo automatically generates all required Android icon sizes:
- **Adaptive Icon**: Uses `adaptive-icon.png` as foreground
  - Generates all density variants (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)
  - Background color is set in `app.json` (`#ffffff`)
- **Legacy Icons**: Generated from the main icon for older Android versions

## Next Steps

### 1. Verify Icon Files
Make sure the icons look correct:
```bash
# Check icon files exist and are correct size
ls -lh assets/icon.png assets/adaptive-icon.png
```

### 2. Test Icons Locally
```bash
# Start Expo and check icons appear correctly
npx expo start

# For iOS simulator
npx expo start --ios

# For Android emulator
npx expo start --android
```

### 3. Build with EAS
When you build with EAS Build, the icons will be automatically included:

```bash
# Development build
eas build --profile development --platform ios
eas build --profile development --platform android

# Production build
eas build --profile production --platform ios
eas build --profile production --platform android
```

### 4. App Store Submission
For **App Store Connect**:
- Use `./assets/appstore-icon.png` (1024x1024) when uploading to App Store Connect
- Or let EAS Submit handle it automatically if configured

For **Google Play Console**:
- Use `./assets/playstore-icon.png` (512x512) when uploading to Google Play Console
- Or let EAS Submit handle it automatically if configured

## Icon Requirements

### iOS (App Store)
- **App Icon**: 1024x1024 pixels (PNG, no transparency)
- **Format**: PNG
- **No transparency** (Apple requirement)

### Android (Play Store)
- **App Icon**: 512x512 pixels (PNG, no transparency)
- **Format**: PNG
- **No transparency** (Google requirement)

## Troubleshooting

### Icons not showing up?
1. Clear Expo cache: `npx expo start -c`
2. Rebuild native projects: `npx expo prebuild --clean`
3. For EAS builds, icons are included automatically

### Icon looks blurry?
- Ensure source icon is exactly 1024x1024 pixels
- Use PNG format (not JPEG)
- Avoid upscaling smaller images

### Android adaptive icon issues?
- Ensure `adaptive-icon.png` is 1024x1024
- The icon should be centered with safe area (about 66% of the image)
- Background color can be changed in `app.json` under `android.adaptiveIcon.backgroundColor`

## Current Configuration

Your `app.json` is configured with:
- Main icon: `./assets/icon.png`
- iOS icon: `./assets/icon.png` (auto-generated sizes)
- Android adaptive icon: `./assets/adaptive-icon.png` with white background
- Notification icon: `./assets/icon.png`

All icons are ready to use! 🎉

