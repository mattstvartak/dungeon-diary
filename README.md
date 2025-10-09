# 🎲 Dungeon Diary

Chronicle your D&D adventures with AI-powered transcription and summaries.

## 🚀 Project Structure

This is a monorepo using pnpm workspaces:

```
dungeon-diary/
├── apps/
│   └── web/              # Next.js 14 web application
├── packages/
│   ├── ui/               # Shared UI components
│   ├── types/            # Shared TypeScript types
│   └── config/           # Shared configuration
├── supabase/
│   └── migrations/       # Database migrations
└── docs/                 # Documentation
```

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom D&D dark fantasy theme
- **UI Components:** shadcn/ui
- **Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth
- **File Storage:** Supabase Storage
- **AI Services:**
  - OpenAI Whisper API (transcription)
  - Anthropic Claude API (summarization)

## 📦 Installation

1. **Install pnpm** (if you haven't already):
```bash
npm install -g pnpm
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Setup environment variables:**
```bash
cp .env.example .env
```

Then edit `.env` with your actual API keys:
- Get Supabase keys from [supabase.com](https://supabase.com)
- Get OpenAI API key from [platform.openai.com](https://platform.openai.com)
- Get Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

4. **Setup Supabase:**
   - Create a new Supabase project
   - Run the migration file in `supabase/migrations/001_initial_schema.sql` in the Supabase SQL Editor
   - Enable Row Level Security policies
   - Setup Storage bucket for audio files

## 🏃 Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Key Files

- `apps/web/src/app/` - Next.js app routes
- `apps/web/src/components/` - React components
- `packages/types/index.ts` - Shared TypeScript types
- `supabase/migrations/` - Database schema
- `tailwind.config.ts` - Custom D&D theme configuration

## 🎨 Design System

The app uses a custom dark fantasy D&D-inspired design:

- **Primary Color:** Crimson/Ruby (#dc2626)
- **Secondary Color:** Gold/Amber (#f59e0b)
- **Font (Headings):** Cinzel (fantasy serif)
- **Font (Body):** Inter (modern sans-serif)

See `design-spec.md` for complete design specifications.

## 📝 Development Phases

### ✅ Phase 0: Setup (Completed)
- [x] Monorepo structure with pnpm workspaces
- [x] Next.js app with TypeScript
- [x] Tailwind CSS with D&D theme
- [x] Database schema
- [x] Base layouts and navigation

### 🚧 Phase 1A: Core Infrastructure (Current)
- [ ] Implement authentication (Supabase Auth)
- [ ] Setup API route structure
- [ ] Implement campaign CRUD operations
- [ ] Build campaign list and detail pages

### 📋 Phase 1B: Recording & Upload (Next)
- [ ] Build audio recording interface
- [ ] Implement file upload functionality
- [ ] Setup Supabase Storage

### 🤖 Phase 1C: AI Processing
- [ ] Integrate Whisper API
- [ ] Integrate Claude API
- [ ] Build processing queue

## 🗂️ Available Routes

- `/` - Landing page
- `/login` - Login page
- `/signup` - Sign up page
- `/app/dashboard` - Main dashboard
- `/app/campaigns` - Campaign list
- `/app/campaigns/[id]` - Campaign detail
- `/app/sessions/[id]` - Session detail

## 🧪 Testing

```bash
# Run tests (coming soon)
pnpm test

# Type checking
pnpm type-check

# Linting
pnpm lint
```

## 🚀 Deployment

The app is designed to be deployed on Vercel:

```bash
pnpm build
```

Then connect your GitHub repo to Vercel for automatic deployments.

## 📖 Documentation

- [Spec Document](./spec.md) - Complete project specification
- [Design Spec](./design-spec.md) - Design system documentation

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

MIT

---

**Built with ❤️ for Dungeon Masters and adventurers everywhere**
