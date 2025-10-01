# Firebase Security Rules Setup

This project includes security rules for Firestore and Firebase Storage to protect user data.

## Deploying Rules

To deploy these rules to your Firebase project, you'll need to use the Firebase CLI:

### 1. Install Firebase CLI (if not already installed)
\`\`\`bash
npm install -g firebase-tools
\`\`\`

### 2. Login to Firebase
\`\`\`bash
firebase login
\`\`\`

### 3. Initialize Firebase in your project (if not already done)
\`\`\`bash
firebase init
\`\`\`
Select:
- Firestore
- Storage

When prompted, use the existing `firestore.rules` and `storage.rules` files.

### 4. Deploy the rules
\`\`\`bash
firebase deploy --only firestore:rules,storage:rules
\`\`\`

## Security Rules Overview

### Firestore Rules (`firestore.rules`)
- **Campaigns**: Users can only read, create, update, and delete their own campaigns
- **Sessions**: Users can only read, create, update, and delete their own sessions
- All operations require authentication
- UserId is validated to match the authenticated user

### Storage Rules (`storage.rules`)
- **Audio Files**: Organized by userId in `/audio/{userId}/` path
- Users can only access their own audio files
- Maximum file size: 100MB per file
- Only audio file types are allowed
- All operations require authentication

## Testing Rules

You can test your rules in the Firebase Console:
1. Go to Firestore Database → Rules tab
2. Click "Rules Playground" to simulate requests
3. Test different scenarios with various user IDs

## Important Notes

- These rules assume all data includes a `userId` field that matches the authenticated user's UID
- Make sure your app always sets the `userId` field when creating documents
- Audio files should be uploaded to paths like `/audio/{userId}/session-{sessionId}.webm`
