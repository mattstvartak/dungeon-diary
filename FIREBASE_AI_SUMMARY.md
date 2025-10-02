# Firebase AI Session Summary Function

## Overview

The `summarizeSession` Firebase function uses the Google Generative AI SDK to automatically generate comprehensive summaries of D&D session transcripts. This helps players and DMs remember important details from their sessions.

## Setup

### 1. Authentication

The function uses the Google Generative AI SDK which automatically uses the Firebase project's default service account credentials. No additional API key setup is required when running in Firebase Functions.

### 2. Deploy the Function

```bash
cd functions
pnpm install
pnpm run build
firebase deploy --only functions:summarizeSession
```

**✅ Successfully Deployed!**
- Function URL: `https://us-central1-dungeon-diary-95142.cloudfunctions.net/summarizeSession`
- Uses Firebase AI Logic with `@firebase/ai` package
- No API key required - uses Firebase project credentials automatically
- Includes FCM push notifications when summary is complete

### 3. Set Up Notifications (Optional)

For push notifications when summaries are complete, see [FCM_SETUP.md](./FCM_SETUP.md) for detailed setup instructions.

## Usage

### Client-Side Integration

```typescript
import { summarizeSession } from '@/lib/functions'

// Generate a summary for a completed session
const handleGenerateSummary = async (sessionId: string) => {
  try {
    const result = await summarizeSession({ sessionId })
    console.log('Summary generated:', result.summary)
    console.log('Summary ID:', result.summaryId)
  } catch (error) {
    console.error('Failed to generate summary:', error)
  }
}
```

### What the Function Does

1. **Fetches Session Data**: Gets the session and associated campaign information
2. **Collects Transcripts**: Retrieves all transcript chunks for the session
3. **Combines Content**: Merges all transcript segments in chronological order
4. **Generates Summary**: Uses Gemini AI to create a comprehensive summary including:
   - Session overview
   - Key events and plot points
   - Character actions
   - NPCs met
   - Items/loot acquired
   - Locations visited
   - Combat encounters
   - Quest progress
   - Player decisions
   - Important session notes

5. **Saves Results**: Stores the summary in Firestore and updates session status
6. **Sends Notifications**: Sends FCM push notification to user's device

### Summary Structure

The AI-generated summary includes these sections:

- **Session Overview**: Brief summary of what happened
- **Key Events**: Important plot points and story developments
- **Character Actions**: Notable actions by player characters
- **NPCs Met**: Non-player characters introduced or interacted with
- **Items/Loot**: Important items, treasures, or equipment acquired
- **Locations**: Places visited or discovered
- **Combat Encounters**: Battles, outcomes, and notable moments
- **Quests/Objectives**: Progress on ongoing quests or new objectives
- **Player Decisions**: Important choices and their consequences
- **Session Notes**: Other important details worth remembering

### API Response

```typescript
interface SummarizeSessionResult {
  ok: boolean
  summaryId: string  // Firestore document ID of the saved summary
  summary: string    // The generated summary text
}
```

### Error Handling

The function handles various error cases:
- Missing or invalid authentication
- Session not found or access denied
- No transcripts found for the session
- AI service errors
- Network or processing errors

### Integration with Session UI

You can integrate this into your session interface:

```typescript
// In your session component
const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
const [summary, setSummary] = useState<string | null>(null)

const generateSummary = async () => {
  if (!sessionId) return
  
  setIsGeneratingSummary(true)
  try {
    const result = await summarizeSession({ sessionId })
    setSummary(result.summary)
    // Optionally refresh session data to get updated summary status
  } catch (error) {
    console.error('Failed to generate summary:', error)
    // Show error to user
  } finally {
    setIsGeneratingSummary(false)
  }
}
```

## Security

- The function verifies user authentication via Firebase Auth
- Users can only summarize their own sessions
- All requests include proper CORS headers
- Session data is validated before processing
- Firebase AI Logic SDK uses Firebase project credentials automatically
- FCM push notifications sent when summary generation completes

## Performance

- Function timeout: 300 seconds (5 minutes)
- Memory allocation: 1GB
- Processes all transcript chunks in memory
- Optimized for sessions with multiple audio chunks

## Future Enhancements

Potential improvements could include:
- Summary templates for different campaign types
- Integration with campaign notes
- Export to different formats (PDF, Markdown)
- Summary sharing between players
- Automatic summary generation when sessions end
