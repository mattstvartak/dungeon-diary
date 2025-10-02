# Firebase Cloud Messaging (FCM) Setup

## Overview

The app now supports Firebase Cloud Messaging (FCM) for push notifications. When a session summary is generated, users will receive both:

1. **Capacitor Local Notifications** (mobile)
2. **Firebase Cloud Messaging** (web and mobile)
3. **Sonner Toast Notifications** (web)

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Firebase Configuration (already set up)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# NEW: VAPID Key for Web Push Notifications
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key
```

## Getting the VAPID Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon)
4. Click on "Cloud Messaging" tab
5. Scroll down to "Web configuration"
6. Generate a new key pair if you don't have one
7. Copy the "Key pair" value (this is your VAPID key)

## How It Works

### 1. **Client-Side Setup**
- FCM token is automatically registered when the user visits a session page
- Token is stored in the user's Firestore document
- Message listeners are set up for foreground notifications

### 2. **Server-Side Notifications**
- When `summarizeSession` Firebase function completes:
  - Summary is saved to Firestore
  - Session status is updated
  - FCM notification is sent to the user's device
  - Notification includes session ID and summary ID

### 3. **Notification Types**
- **Web**: Browser notifications + Sonner toast
- **Mobile**: Capacitor local notifications + FCM push notifications
- **Foreground**: Sonner toast notifications with action buttons

## Notification Content

When a summary is generated, users receive:

- **Title**: "Session Summary Complete"
- **Body**: "AI summary has been generated for '[Session Title]'"
- **Data**: Session ID, Summary ID, and action type
- **Action**: "View Summary" button that navigates to the summary tab

## Testing

1. Enable notifications in your browser/device
2. Generate a session summary
3. You should receive:
   - FCM push notification (if VAPID key is configured)
   - Sonner toast notification (web)
   - Capacitor notification (mobile)

## Troubleshooting

### No Notifications Received
1. Check if VAPID key is correctly set in environment variables
2. Verify FCM is enabled in Firebase Console
3. Check browser/device notification permissions
4. Look for errors in browser console or Firebase function logs

### FCM Token Not Registered
- FCM token registration happens automatically when visiting session pages
- Check if user is authenticated
- Verify Firestore write permissions

### Notifications Not Working on Mobile
- Ensure Capacitor local notifications are properly configured
- Check device notification settings
- Verify FCM configuration in `capacitor.config.ts`

## Security

- FCM tokens are stored securely in Firestore
- Only the session owner receives notifications
- Notifications include session context for proper routing
