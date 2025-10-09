# 🤖 AI Configuration - OpenAI Integration

## Overview

Dungeon Diary uses **OpenAI** for both audio transcription and session summarization:

- **Whisper API** - For accurate D&D session transcription
- **GPT-4** - For intelligent summarization and entity extraction

## Why OpenAI for Everything?

### Benefits
✅ **Single API** - One provider, simpler integration
✅ **Cost Effective** - Bundled usage, consistent pricing
✅ **Proven Quality** - Both services excel at their tasks
✅ **D&D Knowledge** - GPT-4 understands D&D terminology perfectly
✅ **Simpler Billing** - One account to manage

### Cost Breakdown (Updated)

**Per Session (3-hour typical session):**
- Whisper Transcription: ~$1.08 ($0.006/minute × 180 minutes)
- GPT-4 Summarization: ~$0.50-1.00 (depending on transcript length)
- **Total: ~$1.50-2.00 per session**

**Monthly at Scale (100 premium users, 4 sessions/month each):**
- 400 sessions × $2.00 = $800/month in AI costs
- Revenue: $999/month (100 users × $9.99)
- **Profit margin remains healthy at ~$200/month**

## API Configuration

### Environment Variables

```bash
# .env
OPENAI_API_KEY=sk-proj-your-key-here
```

Your key is already configured in `.env`!

## Implementation Plan

### 1. Transcription with Whisper API

```typescript
// app/api/sessions/[id]/transcribe/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  const formData = await request.formData()
  const audioFile = formData.get('audio') as File

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // or auto-detect
      response_format: 'verbose_json', // includes timestamps
    })

    return Response.json({
      transcript: transcription.text,
      segments: transcription.segments, // for key moments
    })
  } catch (error) {
    return Response.json({ error: 'Transcription failed' }, { status: 500 })
  }
}
```

### 2. Summarization with GPT-4

```typescript
// app/api/sessions/[id]/summarize/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SUMMARY_PROMPT = `You are an AI assistant specialized in summarizing D&D sessions.

Analyze the following D&D session transcript and provide:

1. **Session Summary** (2-3 paragraphs):
   - What happened in the session
   - Major plot developments
   - Key character moments

2. **Key Moments** (5-10 moments):
   - Timestamp
   - Brief description
   - Type (combat, roleplay, discovery, plot)

3. **Entities Mentioned**:
   - NPCs encountered
   - Locations visited
   - Loot acquired

Format as JSON with this structure:
{
  "summary": "string",
  "keyMoments": [
    {
      "timestamp": number,
      "description": "string",
      "type": "combat" | "roleplay" | "discovery" | "plot"
    }
  ],
  "npcs": ["string"],
  "locations": ["string"],
  "loot": ["string"]
}

Transcript:
`

export async function POST(request: Request) {
  const { transcript } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // or 'gpt-4o' for latest
      messages: [
        {
          role: 'system',
          content: 'You are a D&D session summarizer. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: SUMMARY_PROMPT + transcript,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = JSON.parse(completion.choices[0].message.content!)

    return Response.json(result)
  } catch (error) {
    return Response.json({ error: 'Summarization failed' }, { status: 500 })
  }
}
```

### 3. "Previously On..." Recap Generation

```typescript
// app/api/sessions/[id]/recap/route.ts
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const RECAP_PROMPT = `Create a dramatic "Previously on..." style recap for a D&D campaign.

Based on the last 3 sessions, write a 2-3 paragraph recap in the style of a TV show narrator that:
- Reminds players of key events
- Highlights unresolved plot threads
- Sets up tension for the next session
- Uses dramatic, evocative language

Keep it exciting and engaging!

Previous sessions:
`

export async function POST(request: Request) {
  const { previousSessions } = await request.json()

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a dramatic D&D campaign narrator.',
        },
        {
          role: 'user',
          content: RECAP_PROMPT + previousSessions.map(s => s.summary).join('\n\n'),
        },
      ],
      temperature: 0.8, // More creative for narrative
      max_tokens: 500,
    })

    return Response.json({
      recap: completion.choices[0].message.content,
    })
  } catch (error) {
    return Response.json({ error: 'Recap generation failed' }, { status: 500 })
  }
}
```

## Model Selection

### Whisper
- **Model:** `whisper-1` (only option, but excellent quality)
- **Pricing:** $0.006 per minute
- **Accuracy:** ~95% for clear audio

### GPT-4 Options
- **gpt-4-turbo-preview** - Good balance of speed/cost ($10/$30 per 1M tokens)
- **gpt-4o** - Latest, faster, cheaper ($2.50/$10 per 1M tokens) ⭐ **RECOMMENDED**
- **gpt-4o-mini** - Budget option ($0.15/$0.60 per 1M tokens) - For free tier

### Recommended Strategy
- **Free tier:** Use `gpt-4o-mini` for basic summaries
- **Premium tier:** Use `gpt-4o` for full analysis with key moments
- **Pay-per-session:** Use `gpt-4o` for best experience

## Optimization Tips

### 1. Chunk Long Transcripts
```typescript
// For sessions > 4 hours, process in chunks
const MAX_TOKENS = 100000 // gpt-4o limit
if (transcript.length > MAX_TOKENS) {
  // Split into chunks, summarize each, then combine
}
```

### 2. Cache Common Requests
```typescript
// Cache recap prompts by campaign
const cacheKey = `recap:${campaignId}:${lastSessionId}`
```

### 3. Streaming for Better UX
```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4o',
  messages: [...],
  stream: true,
})

// Stream response to client for real-time feedback
```

### 4. Background Processing
```typescript
// Use a job queue (BullMQ, Inngest) for long-running AI tasks
await queue.add('process-session', {
  sessionId,
  audioUrl,
})
```

## Error Handling

```typescript
try {
  const result = await openai.chat.completions.create({...})
} catch (error) {
  if (error.status === 429) {
    // Rate limit - retry with exponential backoff
  } else if (error.status === 500) {
    // OpenAI server error - retry
  } else if (error.status === 400) {
    // Bad request - log and fail gracefully
  }
}
```

## Testing

```typescript
// Test with sample D&D transcript
const testTranscript = `
DM: You enter the dark cavern. Roll for initiative!
Player 1: Natural 20!
DM: The goblin chieftain emerges from the shadows...
`

const result = await summarizeSession(testTranscript)
console.log(result.summary)
```

## Next Steps

1. ✅ Environment configured with OpenAI key
2. ⏳ Install OpenAI SDK: `pnpm add openai`
3. ⏳ Create API routes for transcription
4. ⏳ Create API routes for summarization
5. ⏳ Build UI for processing status
6. ⏳ Test with sample audio file
7. ⏳ Deploy and test at scale

---

**Your AI integration is configured and ready to go!** 🤖✨

All you need is to install the OpenAI SDK and create the API routes.
