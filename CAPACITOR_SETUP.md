# Capacitor Setup Instructions

Your Dungeon Diary app is now configured for Capacitor! Follow these steps to build and deploy to iOS and Android.

## Prerequisites

- Node.js and npm installed
- For iOS: macOS with Xcode installed
- For Android: Android Studio installed

## Initial Setup

After downloading or cloning the project, run these commands:

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Initialize Capacitor
\`\`\`bash
npx cap init
\`\`\`
When prompted:
- App name: `Dungeon Diary`
- App ID: `com.dungeondiary.app` (or your preferred bundle ID)
- Web directory: `out`

### 3. Add Platforms

**For iOS:**
\`\`\`bash
npx cap add ios
\`\`\`

**For Android:**
\`\`\`bash
npx cap add android
\`\`\`

## Building and Running

### Build the Web App
\`\`\`bash
npm run build
\`\`\`

### Sync with Native Projects
After each build, sync the web assets to native projects:
\`\`\`bash
npm run cap:sync
\`\`\`

Or use the individual commands:
\`\`\`bash
npx cap sync ios
npx cap sync android
\`\`\`

### Open Native IDEs

**iOS (Xcode):**
\`\`\`bash
npm run cap:open:ios
\`\`\`
Then build and run from Xcode.

**Android (Android Studio):**
\`\`\`bash
npm run cap:open:android
\`\`\`
Then build and run from Android Studio.

## Development Workflow

1. Make changes to your Next.js code
2. Build: `npm run build`
3. Sync: `npm run cap:sync`
4. Open native IDE and run

## Live Reload (Optional)

For faster development, you can use live reload:

1. Start Next.js dev server: `npm run dev`
2. Update `capacitor.config.ts` to point to your local server:
\`\`\`typescript
server: {
  url: 'http://192.168.1.X:3000', // Your local IP
  cleartext: true
}
\`\`\`
3. Sync and run on device

**Remember to remove the server config before production builds!**

## Firebase Configuration

Make sure to add your Firebase config to the native projects:

**iOS:**
- Download `GoogleService-Info.plist` from Firebase Console
- Add it to the iOS project in Xcode

**Android:**
- Download `google-services.json` from Firebase Console
- Place it in `android/app/` directory

## Storage Rules Update

Update your Firebase Storage rules to allow the app to access files:

\`\`\`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
\`\`\`

## Native Features Included

- **Status Bar**: Configured for dark theme
- **Splash Screen**: 2-second display on launch
- **Keyboard**: Optimized resize behavior
- **Back Button**: Android hardware back button support
- **App State**: Listeners for app background/foreground events

## Troubleshooting

**Build fails:**
- Ensure `output: 'export'` is in `next.config.mjs`
- Check that all dynamic routes are properly handled
- Verify Firebase config is correct

**Native features not working:**
- Run `npm run cap:sync` after any changes
- Check that plugins are properly installed
- Verify permissions in native project files

**iOS specific:**
- Update `Info.plist` for required permissions (microphone, camera, etc.)
- Set deployment target to iOS 13.0 or higher

**Android specific:**
- Update `AndroidManifest.xml` for required permissions
- Set minimum SDK to 22 or higher

## Production Checklist

- [ ] Remove live reload server config from `capacitor.config.ts`
- [ ] Update app icons and splash screens
- [ ] Configure proper bundle IDs
- [ ] Add Firebase config files to native projects
- [ ] Test on physical devices
- [ ] Configure signing certificates
- [ ] Update privacy policy and terms
- [ ] Test offline functionality
- [ ] Verify Firebase Storage rules are secure

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [Firebase iOS Setup](https://firebase.google.com/docs/ios/setup)
- [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
