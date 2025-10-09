# Dungeon Diary - Project Specification

## Project Overview

**Dungeon Diary** is a D&D session recording and AI-powered note-taking app that allows Dungeon Masters and players to record their sessions, get automatic transcriptions, and receive AI-generated summaries of key moments.

### Core Value Proposition
- Record D&D sessions without breaking immersion
- AI transcription and intelligent summarization
- Searchable campaign history
- DM dashboard for campaign management
- "Previously on..." recap generation

---

## Tech Stack

### Monorepo Structure
```
dungeon-diary/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native (Expo) - Phase 2
├── packages/
│   ├── ui/           # Shared UI components
│   ├── config/       # Shared configs (ESLint, TypeScript)
│   └── types/        # Shared TypeScript types
├── supabase/         # Supabase migrations and functions
└── docs/             # Documentation
```

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui
- **State Management:** React Context + Zustand (for complex state)
- **Audio Recording:** MediaRecorder API (Web Audio API)
- **Mobile (Phase 2):** React Native with Expo

### Backend
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **API Routes:** Next.js API Routes (for AI processing)
- **Edge Functions:** Supabase Edge Functions (optional, for webhooks)

### AI Services
- **Transcription:** OpenAI Whisper API
- **Summarization:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Cost Optimization:** 
  - Compress audio before upload
  - Delete audio after transcription (keep text only)
  - Cache AI responses

### Hosting & Deployment
- **Web App:** Vercel (free tier to start)
- **Database:** Supabase (free tier: 500MB DB, 1GB storage)
- **Version Control:** GitHub
- **Monorepo Tool:** Turborepo or pnpm workspaces

---

## Data Schema

### Users
```typescript
{
  id: uuid (primary key)
  email: string
  name: string
  avatar_url: string
  created_at: timestamp
  subscription_tier: 'free' | 'premium'
  subscription_expires_at: timestamp?
}
```

### Campaigns
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key -> users)
  name: string
  description: text
  player_names: string[] // Array of player names
  dm_name: string
  created_at: timestamp
  updated_at: timestamp
  cover_image_url: string?
}
```

### Sessions
```typescript
{
  id: uuid (primary key)
  campaign_id: uuid (foreign key -> campaigns)
  title: string
  session_number: integer
  recorded_at: timestamp
  duration_seconds: integer
  
  // Audio
  audio_url: string? // Deleted after transcription
  audio_size_bytes: integer?
  
  // AI Generated Content
  transcript: text?
  summary: text?
  key_moments: json? // Array of { timestamp, description, type }
  npcs_mentioned: string[]?
  locations_mentioned: string[]?
  loot_acquired: string[]?
  
  // Status
  status: 'recording' | 'processing' | 'completed' | 'failed'
  processing_started_at: timestamp?
  processing_completed_at: timestamp?
  error_message: text?
  
  created_at: timestamp
  updated_at: timestamp
}
```

### Shared Sessions (for player access)
```typescript
{
  id: uuid (primary key)
  session_id: uuid (foreign key -> sessions)
  share_token: string (unique)
  created_at: timestamp
  expires_at: timestamp?
  view_count: integer
}
```

### Usage Tracking (for billing)
```typescript
{
  id: uuid (primary key)
  user_id: uuid (foreign key -> users)
  month: date
  sessions_recorded: integer
  ai_recaps_generated: integer
  transcription_minutes: integer
  storage_used_mb: float
}
```

---

## Features Breakdown

### Phase 1: MVP (Week 1-3)

#### 1. Landing Page (`/`)
- Hero section with value proposition
- Feature highlights (3-4 key features)
- Pricing table
- Sign up CTA
- Footer with links

#### 2. Authentication (`/login`, `/signup`)
- Email/password authentication via Supabase Auth
- Google OAuth (optional, easy to add)
- Password reset flow
- Email verification

#### 3. Campaign Management (`/app/campaigns`)
- Create new campaign
- List all campaigns (card grid view)
- Edit campaign details
- Delete campaign (with confirmation)
- Campaign cover image upload

#### 4. Session Recording (`/app/campaigns/[id]/record`)
- Audio recording interface
  - Start/pause/stop recording
  - Real-time duration counter
  - Audio level visualization
  - Browser permission handling
- Upload existing audio file
  - Drag & drop or file picker
  - Support: MP3, WAV, M4A, OGG
  - Max file size: 500MB
- Session metadata input
  - Title
  - Session number (auto-increment)
  - Date/time

#### 5. AI Processing
- Upload audio to Supabase Storage
- Transcribe with Whisper API
  - Show progress indicator
  - Handle long files (chunk if necessary)
- Generate summary with Claude API
  - Extract key moments
  - Identify NPCs, locations, loot
  - Generate "Previously on..." recap
- Delete audio file after successful transcription

#### 6. Session View (`/app/sessions/[id]`)
- Display session metadata
- Show full transcript (with search)
- AI-generated summary
- Key moments timeline
- NPCs/locations/loot lists
- "Previously on..." recap section
- Share button (generate shareable link)
- Export to PDF
- Edit session title/notes

#### 7. DM Dashboard (`/app/dashboard`)
- Campaign overview cards
  - Total sessions
  - Total hours played
  - Last session date
- Recent sessions list
- Quick stats
- Search across all sessions
- "Record New Session" CTA

#### 8. Settings (`/app/settings`)
- Profile management
- Subscription status
- Usage metrics (sessions this month)
- Delete account

### Phase 2: Enhanced Features (Week 4-6)

#### 9. Advanced Dashboard Features
- Campaign analytics
  - Session frequency chart
  - Most mentioned NPCs/locations
  - Player attendance tracking
- Session search with filters
  - By NPC, location, keyword
  - Date range
- Bulk export (all sessions to PDF/markdown)

#### 10. Player Sharing
- Generate public share links for sessions
- Player view (simplified, read-only)
- Embed "Previously on..." widget for Discord/Slack

#### 11. Mobile App (React Native)
- All core features from web app
- Native audio recording
- Push notifications (session processing complete)
- Offline support for viewing past sessions

#### 12. AI Enhancements
- Better NPC/location extraction with confidence scores
- Combat encounter detection
- Dice roll detection from audio
- "What might happen next" predictions
- Character relationship mapping

---

## Monetization Model

### Free Tier
- 1 active campaign
- 3 session recordings per month
- 2 AI recaps per month
- Transcript storage for 30 days
- Basic summary only (no key moments extraction)

### Premium Tier - $9.99/month or $99/year
- Unlimited campaigns
- Unlimited session recordings
- Unlimited AI recaps
- Permanent transcript storage
- Advanced AI features:
  - Key moments extraction
  - NPC/location tracking
  - "Previously on..." recaps
  - Combat encounter detection
- Priority processing
- Export to PDF/Markdown
- Player sharing links
- Email support

### Pay-Per-Session - $4.99 per session
- For casual DMs who don't record often
- One-time payment per session
- Includes full AI processing
- Transcript stored for 90 days
- Good alternative to subscription

### Future: Team Plan - $24.99/month
- Up to 5 DMs
- Shared campaign library
- Collaborative notes
- Usage pooling

### Revenue Projections
- Target: 100 free users → 15-20% conversion to premium
- At 20 premium users: $199/month
- At 100 premium users: $999/month
- AI costs at scale: ~$2-3 per session processed

---

## User Flows

### First-Time User Flow
1. Land on marketing page
2. Click "Start Free Trial" or "Sign Up"
3. Create account (email verification)
4. Onboarding wizard:
   - Create first campaign (name, players, DM)
   - Quick tutorial (how to record)
5. Redirected to campaign page with "Record Your First Session" CTA

### Recording a Session Flow
1. Click "Record New Session" from dashboard or campaign page
2. Enter session metadata (title, number)
3. Choose recording method:
   - Record now (browser mic)
   - Upload file
4. If recording: Start → Pause/Resume → Stop
5. Review recording details
6. Click "Process with AI"
7. Processing screen (progress bar, estimated time)
8. Redirected to session view when complete
9. Review transcript and summary

### Recap Generation Flow
1. From session view, click "Generate Recap"
2. AI analyzes session + previous sessions
3. Generates "Previously on..." style recap
4. Option to edit before sharing
5. Copy to clipboard or share link

---

## API Routes

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/reset-password` - Password reset

### Campaigns
- `GET /api/campaigns` - List user's campaigns
- `POST /api/campaigns` - Create campaign
- `GET /api/campaigns/[id]` - Get campaign details
- `PATCH /api/campaigns/[id]` - Update campaign
- `DELETE /api/campaigns/[id]` - Delete campaign

### Sessions
- `GET /api/campaigns/[id]/sessions` - List sessions
- `POST /api/sessions` - Create session (metadata only)
- `GET /api/sessions/[id]` - Get session details
- `PATCH /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session

### Audio Processing
- `POST /api/sessions/[id]/upload` - Upload audio file
- `POST /api/sessions/[id]/transcribe` - Start transcription
- `POST /api/sessions/[id]/summarize` - Generate AI summary
- `GET /api/sessions/[id]/status` - Check processing status

### AI Features
- `POST /api/sessions/[id]/recap` - Generate "Previously on..." recap
- `POST /api/sessions/[id]/extract-entities` - Extract NPCs/locations

### Sharing
- `POST /api/sessions/[id]/share` - Create share link
- `GET /api/share/[token]` - Get shared session (public)

### Billing
- `GET /api/billing/usage` - Get current month usage
- `POST /api/billing/upgrade` - Upgrade to premium
- `POST /api/billing/cancel` - Cancel subscription

---

## Development Phases

### Phase 0: Setup (Days 1-2)
- [ ] Initialize monorepo with Turborepo/pnpm
- [ ] Setup Next.js app with TypeScript
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Setup Supabase project
- [ ] Create database schema and migrations
- [ ] Setup GitHub repository
- [ ] Configure Vercel deployment

### Phase 1A: Core Infrastructure (Days 3-5)
- [ ] Implement authentication (Supabase Auth)
- [ ] Create base layouts and navigation
- [ ] Setup API route structure
- [ ] Implement campaign CRUD operations
- [ ] Build campaign list and detail pages

### Phase 1B: Recording & Upload (Days 6-8)
- [ ] Build audio recording interface
- [ ] Implement file upload functionality
- [ ] Create session metadata form
- [ ] Setup Supabase Storage for audio files
- [ ] Build session list view

### Phase 1C: AI Processing (Days 9-12)
- [ ] Integrate Whisper API for transcription
- [ ] Integrate Claude API for summarization
- [ ] Build processing queue/status system
- [ ] Implement key moments extraction
- [ ] Create session detail view with transcript

### Phase 1D: Dashboard & Landing (Days 13-15)
- [ ] Build DM dashboard with stats
- [ ] Implement session search
- [ ] Create landing page with marketing copy
- [ ] Add pricing page
- [ ] Build settings page

### Phase 1E: Polish & Testing (Days 16-18)
- [ ] Error handling and edge cases
- [ ] Loading states and UI polish
- [ ] Mobile responsive design
- [ ] Testing on different browsers
- [ ] Performance optimization

### Phase 1F: Launch Prep (Days 19-21)
- [ ] Setup analytics (Vercel Analytics or Plausible)
- [ ] Implement free tier limits
- [ ] Add email notifications (processing complete)
- [ ] Write documentation/help center
- [ ] Beta test with 5-10 users

### Phase 2: Premium Features (Weeks 4-6)
- [ ] Implement Stripe for payments
- [ ] Build subscription management
- [ ] Add advanced AI features
- [ ] Create player sharing functionality
- [ ] Build export features (PDF/Markdown)

### Phase 3: Mobile App (Weeks 7-10)
- [ ] Setup React Native with Expo
- [ ] Port core features to mobile
- [ ] Implement native audio recording
- [ ] Add offline support
- [ ] Submit to App Store and Google Play

---

## Cost Estimates

### Development (if outsourced)
- Solo developer: 3-4 weeks full-time
- With AI assistance (Claude Code/Cursor): 2-3 weeks

### Monthly Running Costs (at scale)

**At 100 users (20 premium):**
- Supabase: $25/month (Pro tier)
- Vercel: $20/month (Pro tier)
- OpenAI Whisper: ~$60/month (20 sessions × 3 hours × $0.006/min)
- Anthropic Claude: ~$15/month (20 sessions × summarization)
- Domain: $1/month
- **Total: ~$121/month**
- **Revenue: ~$199/month (20 premium users)**
- **Profit: ~$78/month**

**At 500 users (100 premium):**
- Supabase: $25/month
- Vercel: $20/month
- AI costs: ~$375/month
- **Total: ~$420/month**
- **Revenue: ~$999/month**
- **Profit: ~$579/month**

### Break-even Point
- Need ~15-20 premium subscribers to break even
- Each additional premium user is ~$8/month profit (after AI costs)

---

## Success Metrics

### MVP Success (First 3 months)
- 100 signups
- 15-20 premium conversions (15-20% conversion rate)
- 50+ sessions recorded
- <5% churn rate
- Positive feedback from beta users

### Growth Targets (6 months)
- 500 total users
- 75-100 premium subscribers
- $750-1000 MRR
- Featured in r/DnD, r/DMAcademy
- Partnerships with D&D YouTubers/podcasters

### Key Metrics to Track
- Signup conversion rate (landing → signup)
- Free to premium conversion rate
- Session recording frequency
- AI processing success rate
- Churn rate
- Customer acquisition cost (CAC)
- Lifetime value (LTV)

---

## Marketing Strategy

### Launch Strategy
1. **Reddit:** Post in r/DnD, r/DMAcademy, r/DMToolkit with "I built this" story
2. **Product Hunt:** Launch after 2 weeks of beta testing
3. **Discord Communities:** Share in D&D-related servers
4. **Content Marketing:** Blog posts about "How to remember your D&D sessions"
5. **YouTube/TikTok:** Demo videos showing before/after

### Growth Tactics
- Referral program (free month for successful referral)
- Free tier with "Powered by Dungeon Diary" watermark on shared recaps
- Integration with popular D&D tools (D&D Beyond, Roll20)
- Sponsor D&D podcasts/actual plays
- SEO content around "D&D session notes," "campaign management tools"

---

## Technical Considerations

### Performance
- Lazy load transcripts (paginate long sessions)
- Use streaming for AI responses to show progress
- Compress audio before upload (client-side)
- CDN for static assets via Vercel
- Database indexing on frequently queried fields

### Security
- Row Level Security (RLS) in Supabase
- API rate limiting to prevent abuse
- Secure audio file URLs (signed URLs with expiration)
- Input sanitization for all user content
- HTTPS only

### Scalability
- Horizontal scaling via Vercel Edge Functions
- Supabase auto-scales database
- Queue system for AI processing (prevent timeouts)
- Consider BullMQ or Inngest for job queue at scale

### Error Handling
- Graceful degradation if AI services are down
- Retry logic for failed transcriptions
- Clear error messages for users
- Logging and monitoring (Sentry or LogRocket)

---

## Competitive Analysis

### Existing Solutions
1. **Otter.ai** - General transcription, not D&D-specific
2. **Notion** - Manual note-taking, no audio
3. **World Anvil** - Campaign wiki, no recording
4. **Obsidian Portal** - Static notes, no AI

### Dungeon Diary Advantages
- ✅ D&D-specific AI understanding (spells, monsters, mechanics)
- ✅ "Previously on..." recap format DMs actually need
- ✅ Audio recording built-in (no separate tool needed)
- ✅ Affordable pricing for hobby DMs
- ✅ Player sharing features

---

## Future Feature Ideas (Backlog)

- **Voice identification:** Separate speakers in transcript
- **Background music removal:** Filter out ambient D&D music
- **Campaign wiki generation:** Auto-generate wiki from sessions
- **Character sheets integration:** Link mentions to character stats
- **Discord bot:** Recap bot that posts to campaign Discord
- **VTT integration:** Roll20, Foundry VTT plugins
- **Collaborative editing:** Let players add their own notes
- **Session highlights:** AI picks best moments for clip compilation
- **Mood/tone analysis:** Track campaign emotional arc
- **Translation:** Translate recaps to other languages

---

## Open Questions / Decisions Needed

1. **Audio deletion policy:** Delete immediately after transcription or keep for X days?
   - Recommendation: Delete after 7 days (give users time to re-process if needed)

2. **Free tier limits:** 3 sessions/month or 5 sessions/month?
   - Recommendation: 3 sessions (generous for trial, not enough for weekly campaigns)

3. **Mobile app priority:** Build after web validation or in parallel?
   - Recommendation: Validate web app first (faster iteration)

4. **Payment processor:** Stripe, LemonSqueezy, or Paddle?
   - Recommendation: Stripe (most features, best docs for developers)

5. **Should we support video recording?**
   - Recommendation: Phase 3 feature (audio-only is simpler MVP)

---

## Getting Started Checklist

- [ ] Create GitHub repository
- [ ] Setup Turborepo monorepo structure
- [ ] Initialize Next.js app
- [ ] Create Supabase project
- [ ] Setup Vercel project
- [ ] Purchase domain (dungeondia.ry or dungeondiary.app)
- [ ] Setup OpenAI API account
- [ ] Setup Anthropic API account
- [ ] Create project board (GitHub Projects or Linear)
- [ ] Setup development environment variables
- [ ] Write initial database migrations
- [ ] Create first components with shadcn/ui

---

## Resources & Documentation

### Tutorials to Reference
- [Next.js App Router Docs](https://nextjs.org/docs)
- [Supabase Auth with Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)
- [Turborepo Handbook](https://turbo.build/repo/docs/handbook)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/messages_post)
- [shadcn/ui Components](https://ui.shadcn.com)

### Community
- r/DnD (1.5M members)
- r/DMAcademy (300K members)
- r/webdev for technical questions
- Discord: Next.js, Supabase communities

---

## Notes

- Keep MVP simple - resist feature creep
- Launch imperfect and iterate based on user feedback
- Focus on one killer feature: AI-powered session summaries
- DMs are the primary customer - optimize for their workflow
- Consider seasonal patterns (less D&D during summer months)
- Build in public - share progress on Twitter/Reddit

---

**Last Updated:** October 9, 2025
**Status:** Ready to build 🚀
