# Dungeon Diary - Design System Specification

## Overview
Dungeon Diary uses a dark fantasy D&D-inspired design system with rich reds, warm golds, and deep shadows. The aesthetic should evoke the feeling of a candlelit tavern or ancient spellbook while remaining modern and highly usable.

---

## Color Palette

### Primary Colors (Crimson/Ruby)
```css
--primary-50: #fef2f2    /* Lightest red - hover states */
--primary-100: #fee2e2   /* Very light red */
--primary-200: #fecaca   /* Light red */
--primary-300: #fca5a5   /* Medium light red */
--primary-400: #f87171   /* Medium red */
--primary-500: #dc2626   /* Primary red - main brand color */
--primary-600: #b91c1c   /* Dark red - hover states */
--primary-700: #991b1b   /* Darker red */
--primary-800: #7f1d1d   /* Very dark red */
--primary-900: #450a0a   /* Darkest red */
```

### Secondary Colors (Gold/Amber)
```css
--secondary-50: #fffbeb   /* Lightest gold */
--secondary-100: #fef3c7  /* Very light gold */
--secondary-200: #fde68a  /* Light gold */
--secondary-300: #fcd34d  /* Medium light gold */
--secondary-400: #fbbf24  /* Medium gold */
--secondary-500: #f59e0b  /* Primary gold - accents */
--secondary-600: #d97706  /* Dark gold */
--secondary-700: #b45309  /* Darker gold */
--secondary-800: #92400e  /* Very dark gold */
--secondary-900: #78350f  /* Darkest gold */
```

### Background Colors (Dark Grays with warm undertone)
```css
--background-base: #0a0a0a        /* Pure black - page background */
--background-elevated: #171717    /* Slightly elevated - cards */
--background-elevated-hover: #1f1f1f  /* Elevated hover state */
--background-subtle: #262626      /* Subtle elements - inputs */
--background-muted: #404040       /* Muted backgrounds */
```

### Text Colors
```css
--text-primary: #fafafa      /* Primary text - headings, body */
--text-secondary: #a3a3a3    /* Secondary text - descriptions */
--text-muted: #737373        /* Muted text - placeholders, disabled */
--text-inverse: #0a0a0a      /* Inverse text - on colored backgrounds */
```

### Border Colors
```css
--border-subtle: #262626     /* Subtle borders - dividers */
--border-default: #404040    /* Default borders - cards, inputs */
--border-strong: #525252     /* Strong borders - focus states */
--border-accent: #dc2626     /* Accent borders - primary elements */
```

### Semantic Colors

#### Success (Emerald green - magical/healing)
```css
--success-light: #6ee7b7
--success-default: #10b981
--success-dark: #047857
```

#### Warning (Amber - caution)
```css
--warning-light: #fcd34d
--warning-default: #f59e0b
--warning-dark: #d97706
```

#### Error (Red - danger)
```css
--error-light: #fca5a5
--error-default: #dc2626
--error-dark: #991b1b
```

#### Info (Blue - magic/arcane)
```css
--info-light: #93c5fd
--info-default: #3b82f6
--info-dark: #1d4ed8
```

### Special Effects
```css
--glow-primary: rgba(220, 38, 38, 0.5)    /* Red glow */
--glow-secondary: rgba(245, 158, 11, 0.5) /* Gold glow */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5)
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5)
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5)
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5)
--shadow-glow: 0 0 20px var(--glow-primary)
```

---

## Typography

### Font Families
```css
/* Headings - Fantasy serif for that D&D feeling */
--font-heading: 'Cinzel', 'Garamond', serif

/* Body - Clean sans-serif for readability */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

/* Monospace - For code, session IDs */
--font-mono: 'JetBrains Mono', 'Fira Code', monospace
```

### Font Scales
```css
/* Mobile First */
--text-xs: 0.75rem     /* 12px */
--text-sm: 0.875rem    /* 14px */
--text-base: 1rem      /* 16px */
--text-lg: 1.125rem    /* 18px */
--text-xl: 1.25rem     /* 20px */
--text-2xl: 1.5rem     /* 24px */
--text-3xl: 1.875rem   /* 30px */
--text-4xl: 2.25rem    /* 36px */
--text-5xl: 3rem       /* 48px */
--text-6xl: 3.75rem    /* 60px */

/* Desktop (adjust at 768px+ breakpoint) */
@media (min-width: 768px) {
  --text-3xl: 2.25rem    /* 36px */
  --text-4xl: 3rem       /* 48px */
  --text-5xl: 4rem       /* 64px */
  --text-6xl: 5rem       /* 80px */
}
```

### Font Weights
```css
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
--font-extrabold: 800
```

### Line Heights
```css
--leading-none: 1
--leading-tight: 1.25
--leading-snug: 1.375
--leading-normal: 1.5
--leading-relaxed: 1.625
--leading-loose: 2
```

### Letter Spacing
```css
--tracking-tighter: -0.05em
--tracking-tight: -0.025em
--tracking-normal: 0
--tracking-wide: 0.025em
--tracking-wider: 0.05em
--tracking-widest: 0.1em
```

---

## Spacing Scale

```css
--spacing-0: 0
--spacing-1: 0.25rem   /* 4px */
--spacing-2: 0.5rem    /* 8px */
--spacing-3: 0.75rem   /* 12px */
--spacing-4: 1rem      /* 16px */
--spacing-5: 1.25rem   /* 20px */
--spacing-6: 1.5rem    /* 24px */
--spacing-8: 2rem      /* 32px */
--spacing-10: 2.5rem   /* 40px */
--spacing-12: 3rem     /* 48px */
--spacing-16: 4rem     /* 64px */
--spacing-20: 5rem     /* 80px */
--spacing-24: 6rem     /* 96px */
--spacing-32: 8rem     /* 128px */
```

---

## Border Radius

```css
--radius-none: 0
--radius-sm: 0.125rem   /* 2px */
--radius-base: 0.25rem  /* 4px */
--radius-md: 0.375rem   /* 6px */
--radius-lg: 0.5rem     /* 8px */
--radius-xl: 0.75rem    /* 12px */
--radius-2xl: 1rem      /* 16px */
--radius-3xl: 1.5rem    /* 24px */
--radius-full: 9999px   /* Perfect circle */
```

---

## Component Specifications

### Buttons

#### Primary Button (Call-to-action)
```css
background: linear-gradient(135deg, var(--primary-600), var(--primary-700))
color: var(--text-primary)
padding: 12px 24px
border-radius: var(--radius-lg)
font-weight: var(--font-semibold)
font-size: var(--text-base)
border: 1px solid var(--primary-700)
box-shadow: 0 0 20px rgba(220, 38, 38, 0.3)
transition: all 0.2s ease

/* Hover */
background: linear-gradient(135deg, var(--primary-500), var(--primary-600))
box-shadow: 0 0 30px rgba(220, 38, 38, 0.5)
transform: translateY(-1px)

/* Active/Pressed */
transform: translateY(0)
box-shadow: 0 0 15px rgba(220, 38, 38, 0.3)

/* Disabled */
opacity: 0.5
cursor: not-allowed
```

#### Secondary Button (Less emphasis)
```css
background: var(--background-elevated)
color: var(--text-primary)
padding: 12px 24px
border-radius: var(--radius-lg)
font-weight: var(--font-semibold)
font-size: var(--text-base)
border: 1px solid var(--border-default)
transition: all 0.2s ease

/* Hover */
background: var(--background-elevated-hover)
border-color: var(--border-strong)

/* Active */
background: var(--background-subtle)
```

#### Ghost Button (Minimal)
```css
background: transparent
color: var(--text-secondary)
padding: 12px 24px
border-radius: var(--radius-lg)
font-weight: var(--font-medium)
border: none
transition: all 0.2s ease

/* Hover */
background: var(--background-elevated)
color: var(--text-primary)
```

#### Icon Button
```css
width: 40px
height: 40px
padding: 8px
border-radius: var(--radius-lg)
background: var(--background-elevated)
border: 1px solid var(--border-default)
transition: all 0.2s ease

/* Hover */
background: var(--background-elevated-hover)
border-color: var(--primary-600)
```

### Cards

#### Default Card
```css
background: var(--background-elevated)
border: 1px solid var(--border-default)
border-radius: var(--radius-xl)
padding: var(--spacing-6)
box-shadow: var(--shadow-lg)
transition: all 0.2s ease

/* Hover (if interactive) */
border-color: var(--border-accent)
box-shadow: 0 0 30px rgba(220, 38, 38, 0.2)
transform: translateY(-2px)
```

#### Campaign Card (with accent border)
```css
background: var(--background-elevated)
border: 2px solid var(--primary-700)
border-radius: var(--radius-xl)
padding: var(--spacing-6)
box-shadow: 0 0 20px rgba(220, 38, 38, 0.2)
position: relative
overflow: hidden

/* Decorative corner accent */
::before {
  content: ''
  position: absolute
  top: 0
  right: 0
  width: 60px
  height: 60px
  background: linear-gradient(135deg, var(--primary-600), transparent)
  opacity: 0.3
}
```

#### Session Card
```css
background: var(--background-elevated)
border-left: 4px solid var(--secondary-600)
border-radius: var(--radius-lg)
padding: var(--spacing-4)
box-shadow: var(--shadow-md)
transition: all 0.2s ease

/* Hover */
border-left-color: var(--secondary-500)
background: var(--background-elevated-hover)
```

### Inputs

#### Text Input
```css
background: var(--background-subtle)
color: var(--text-primary)
padding: 12px 16px
border: 1px solid var(--border-default)
border-radius: var(--radius-lg)
font-size: var(--text-base)
transition: all 0.2s ease

/* Focus */
border-color: var(--primary-600)
box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1)
outline: none

/* Error */
border-color: var(--error-default)

/* Disabled */
opacity: 0.5
cursor: not-allowed
```

#### Textarea
```css
/* Same as text input but */
min-height: 120px
resize: vertical
```

#### Select Dropdown
```css
background: var(--background-subtle)
color: var(--text-primary)
padding: 12px 40px 12px 16px
border: 1px solid var(--border-default)
border-radius: var(--radius-lg)
font-size: var(--text-base)
appearance: none
background-image: url("data:image/svg+xml;charset=UTF-8,<svg...>") /* Dropdown arrow */
background-repeat: no-repeat
background-position: right 12px center
transition: all 0.2s ease

/* Focus */
border-color: var(--primary-600)
box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1)
```

#### File Upload Zone
```css
background: var(--background-elevated)
border: 2px dashed var(--border-default)
border-radius: var(--radius-xl)
padding: var(--spacing-12)
text-align: center
transition: all 0.2s ease
cursor: pointer

/* Hover or drag over */
border-color: var(--primary-600)
background: rgba(220, 38, 38, 0.05)

/* Active upload */
border-style: solid
border-color: var(--secondary-600)
background: rgba(245, 158, 11, 0.05)
```

### Navigation

#### Top Navigation Bar
```css
background: var(--background-base)
border-bottom: 1px solid var(--border-default)
padding: var(--spacing-4) var(--spacing-6)
position: sticky
top: 0
z-index: 50
backdrop-filter: blur(10px)
background: rgba(10, 10, 10, 0.9)
```

#### Sidebar Navigation
```css
background: var(--background-elevated)
border-right: 1px solid var(--border-default)
width: 280px
padding: var(--spacing-6)
height: 100vh
position: fixed
left: 0
top: 0
```

#### Nav Link (Active)
```css
background: linear-gradient(90deg, var(--primary-600), transparent)
color: var(--text-primary)
padding: 12px 16px
border-radius: var(--radius-lg)
border-left: 3px solid var(--primary-600)
font-weight: var(--font-semibold)
```

#### Nav Link (Inactive)
```css
color: var(--text-secondary)
padding: 12px 16px
border-radius: var(--radius-lg)
border-left: 3px solid transparent
transition: all 0.2s ease

/* Hover */
background: var(--background-elevated-hover)
color: var(--text-primary)
border-left-color: var(--primary-700)
```

### Badges

#### Status Badge (Recording)
```css
background: var(--error-default)
color: var(--text-primary)
padding: 4px 12px
border-radius: var(--radius-full)
font-size: var(--text-xs)
font-weight: var(--font-semibold)
text-transform: uppercase
letter-spacing: var(--tracking-wider)
display: inline-flex
align-items: center
gap: 6px

/* Pulsing dot */
::before {
  content: ''
  width: 8px
  height: 8px
  border-radius: 50%
  background: white
  animation: pulse 2s infinite
}
```

#### Status Badge (Processing)
```css
background: var(--warning-default)
color: var(--text-inverse)
/* Rest same as Recording */
```

#### Status Badge (Completed)
```css
background: var(--success-default)
color: var(--text-inverse)
/* Rest same as Recording, no pulsing dot */
```

#### Count Badge
```css
background: var(--primary-600)
color: var(--text-primary)
padding: 2px 8px
border-radius: var(--radius-full)
font-size: var(--text-xs)
font-weight: var(--font-bold)
min-width: 20px
text-align: center
```

### Progress Indicators

#### Progress Bar
```css
background: var(--background-subtle)
height: 8px
border-radius: var(--radius-full)
overflow: hidden
position: relative

/* Progress fill */
.fill {
  background: linear-gradient(90deg, var(--secondary-600), var(--secondary-500))
  height: 100%
  border-radius: var(--radius-full)
  transition: width 0.3s ease
  position: relative
  overflow: hidden
}

/* Animated shimmer */
.fill::after {
  content: ''
  position: absolute
  top: 0
  left: -100%
  width: 100%
  height: 100%
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)
  animation: shimmer 2s infinite
}
```

#### Loading Spinner
```css
width: 40px
height: 40px
border: 3px solid var(--border-default)
border-top-color: var(--primary-600)
border-radius: 50%
animation: spin 0.8s linear infinite

@keyframes spin {
  to { transform: rotate(360deg) }
}
```

### Modals/Dialogs

#### Modal Overlay
```css
background: rgba(0, 0, 0, 0.8)
backdrop-filter: blur(4px)
position: fixed
inset: 0
z-index: 100
display: flex
align-items: center
justify-content: center
padding: var(--spacing-4)
```

#### Modal Content
```css
background: var(--background-elevated)
border: 1px solid var(--border-accent)
border-radius: var(--radius-2xl)
padding: var(--spacing-8)
max-width: 600px
width: 100%
box-shadow: 0 0 50px rgba(220, 38, 38, 0.3), var(--shadow-xl)
position: relative
```

#### Modal Header
```css
margin-bottom: var(--spacing-6)
padding-bottom: var(--spacing-4)
border-bottom: 1px solid var(--border-default)

h2 {
  font-family: var(--font-heading)
  font-size: var(--text-2xl)
  font-weight: var(--font-bold)
  color: var(--text-primary)
}
```

### Toast Notifications

#### Success Toast
```css
background: var(--background-elevated)
border-left: 4px solid var(--success-default)
border-radius: var(--radius-lg)
padding: var(--spacing-4)
box-shadow: var(--shadow-xl)
display: flex
align-items: center
gap: var(--spacing-3)
min-width: 300px
```

#### Error Toast
```css
/* Same as success but */
border-left-color: var(--error-default)
```

#### Warning Toast
```css
/* Same as success but */
border-left-color: var(--warning-default)
```

### Tables

#### Table Container
```css
background: var(--background-elevated)
border: 1px solid var(--border-default)
border-radius: var(--radius-xl)
overflow: hidden
```

#### Table Header
```css
background: var(--background-base)
border-bottom: 2px solid var(--border-accent)
padding: var(--spacing-4)
font-weight: var(--font-semibold)
font-size: var(--text-sm)
text-transform: uppercase
letter-spacing: var(--tracking-wider)
color: var(--text-secondary)
```

#### Table Row
```css
border-bottom: 1px solid var(--border-subtle)
padding: var(--spacing-4)
transition: all 0.2s ease

/* Hover */
background: var(--background-elevated-hover)
```

### Audio Player / Recorder

#### Recording Interface
```css
background: var(--background-elevated)
border: 2px solid var(--error-default)
border-radius: var(--radius-2xl)
padding: var(--spacing-8)
text-align: center
box-shadow: 0 0 40px rgba(220, 38, 38, 0.4)
```

#### Waveform Visualizer
```css
background: var(--background-subtle)
border-radius: var(--radius-lg)
padding: var(--spacing-4)
height: 120px
display: flex
align-items: center
justify-content: center
gap: 2px

/* Individual bars */
.bar {
  width: 4px
  background: linear-gradient(to top, var(--primary-700), var(--primary-500))
  border-radius: var(--radius-sm)
  transition: height 0.1s ease
}
```

#### Time Display
```css
font-family: var(--font-mono)
font-size: var(--text-3xl)
font-weight: var(--font-bold)
color: var(--text-primary)
letter-spacing: var(--tracking-wide)
text-shadow: 0 0 10px rgba(220, 38, 38, 0.5)
```

---

## Decorative Elements

### Ornamental Dividers
```css
/* Between sections */
.divider-ornate {
  height: 1px
  background: linear-gradient(to right, transparent, var(--primary-700), transparent)
  margin: var(--spacing-8) 0
  position: relative
}

.divider-ornate::before {
  content: '⚔'
  position: absolute
  top: 50%
  left: 50%
  transform: translate(-50%, -50%)
  background: var(--background-base)
  padding: 0 var(--spacing-4)
  color: var(--secondary-600)
  font-size: var(--text-xl)
}
```

### Corner Accents (for cards)
```css
.corner-accent {
  position: relative
}

.corner-accent::before,
.corner-accent::after {
  content: ''
  position: absolute
  width: 20px
  height: 20px
  border: 2px solid var(--secondary-600)
  opacity: 0.5
}

.corner-accent::before {
  top: 0
  left: 0
  border-right: none
  border-bottom: none
}

.corner-accent::after {
  bottom: 0
  right: 0
  border-left: none
  border-top: none
}
```

### Glow Effects
```css
.glow-effect {
  box-shadow: 0 0 30px rgba(220, 38, 38, 0.3)
  animation: glow-pulse 3s ease-in-out infinite
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 30px rgba(220, 38, 38, 0.3) }
  50% { box-shadow: 0 0 50px rgba(220, 38, 38, 0.5) }
}
```

### Parchment Texture (optional for special cards)
```css
background: var(--background-elevated)
background-image: 
  repeating-linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.03) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 3px
  ),
  repeating-linear-gradient(
    0deg,
    rgba(0, 0, 0, 0.03) 0px,
    transparent 1px,
    transparent 2px,
    rgba(0, 0, 0, 0.03) 3px
  )
```

---

## Animations

### Fade In
```css
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

.fade-in {
  animation: fadeIn 0.3s ease-in
}
```

### Slide In from Bottom
```css
@keyframes slideInUp {
  from {
    opacity: 0
    transform: translateY(20px)
  }
  to {
    opacity: 1
    transform: translateY(0)
  }
}

.slide-in-up {
  animation: slideInUp 0.4s ease-out
}
```

### Pulse (for recording indicator)
```css
@keyframes pulse {
  0%, 100% { opacity: 1 }
  50% { opacity: 0.5 }
}

.pulse {
  animation: pulse 2s ease-in-out infinite
}
```

### Shimmer (for loading states)
```css
@keyframes shimmer {
  0% { transform: translateX(-100%) }
  100% { transform: translateX(100%) }
}

.shimmer {
  position: relative
  overflow: hidden
}

.shimmer::after {
  content: ''
  position: absolute
  top: 0
  left: -100%
  width: 100%
  height: 100%
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)
  animation: shimmer 2s infinite
}
```

---

## Layout Specifications

### Page Container
```css
max-width: 1400px
margin: 0 auto
padding: var(--spacing-6)

@media (min-width: 768px) {
  padding: var(--spacing-8)
}

@media (min-width: 1024px) {
  padding: var(--spacing-12)
}
```

### Grid System
```css
/* 2-column grid on tablet+ */
.grid-2 {
  display: grid
  gap: var(--spacing-6)
  grid-template-columns: 1fr
}

@media (min-width: 768px) {
  .grid-2 {
    grid-template-columns: repeat(2, 1fr)
  }
}

/* 3-column grid on desktop */
.grid-3 {
  display: grid
  gap: var(--spacing-6)
  grid-template-columns: 1fr
}

@media (min-width: 768px) {
  .grid-3 {
    grid-template-columns: repeat(2, 1fr)
  }
}

@media (min-width: 1024px) {
  .grid-3 {
    grid-template-columns: repeat(3, 1fr)
  }
}
```

### Dashboard Layout
```css
/* Sidebar + Main content */
.dashboard-layout {
  display: grid
  grid-template-columns: 280px 1fr
  min-height: 100vh
}

/* Mobile: stack vertically */
@media (max-width: 768px) {
  .dashboard-layout {
    grid-template-columns: 1fr
  }
  
  .sidebar {
    position: fixed
    left: -280px
    transition: left 0.3s ease
    z-index: 50
  }
  
  .sidebar.open {
    left: 0
  }
}
```

---

## Icon System

### Icon Sizes
```css
--icon-xs: 16px
--icon-sm: 20px
--icon-md: 24px
--icon-lg: 32px
--icon-xl: 40px
```

### Icon Colors (use lucide-react or similar)
```css
/* Primary icons */
color: var(--text-primary)
stroke-width: 2px

/* Secondary icons */
color: var(--text-secondary)
stroke-width: 2px

/* Accent icons */
color: var(--primary-600)
stroke-width: 2.5px
```

### D&D-Specific Icons to Use
- 🎲 Dice (for campaigns, sessions)
- ⚔️ Crossed swords (for combat)
- 🗡️ Sword (for actions)
- 📜 Scroll (for transcripts)
- 🏰 Castle (for locations)
- 👥 People (for NPCs)
- 💰 Coin (for loot)
- 🎭 Masks (for characters)
- 🔮 Crystal ball (for AI features)
- 📖 Book (for notes, lore)
- 🕯️ Candle (for ambient/mood)
- ⭐ Star (for favorites, highlights)

---

## Responsive Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm: 640px   /* Small tablets */
--breakpoint-md: 768px   /* Tablets */
--breakpoint-lg: 1024px  /* Laptops */
--breakpoint-xl: 1280px  /* Desktops */
--breakpoint-2xl: 1536px /* Large desktops */
```

---

## Page-Specific Designs

### Landing Page Hero
```css
background: radial-gradient(circle at center, rgba(220, 38, 38, 0.15), transparent 70%)
min-height: 80vh
display: flex
align-items: center
justify-content: center
text-align: center
padding: var(--spacing-12)

h1 {
  font-family: var(--font-heading)
  font-size: var(--text-5xl)
  font-weight: var(--font-bold)
  background: linear-gradient(135deg, var(--primary-500), var(--secondary-500))
  -webkit-background-clip: text
  -webkit-text-fill-color: transparent
  background-clip: text
  margin-bottom: var(--spacing-6)
}

p {
  font-size: var(--text-xl)
  color: var(--text-secondary)
  max-width: 600px
  margin: 0 auto var(--spacing-8)
}
```

### Campaign Card (Dashboard)
```css
background: var(--background-elevated)
border: 2px solid var(--primary-700)
border-radius: var(--radius-xl)
padding: var(--spacing-6)
position: relative
overflow: hidden
cursor: pointer
transition: all 0.2s ease

/* Background image overlay */
.campaign-cover {
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  opacity: 0.1
  object-fit: cover
  z-index: 0
}

/* Content */
.campaign-content {
  position: relative
  z-index: 1
}

.campaign-title {
  font-family: var(--font-heading)
  font-size: var(--text-2xl)
  font-weight: var(--font-bold)
  color: var(--text-primary)
  margin-bottom: var(--spacing-2)
}

.campaign-meta {
  display: flex
  gap: var(--spacing-4)
  color: var(--text-secondary)
  font-size: var(--text-sm)
}

/* Hover state */
&:hover {
  border-color: var(--primary-500)
  box-shadow: 0 0 40px rgba(220, 38, 38, 0.3)
  transform: translateY(-4px)
}
```

### Session List Item
```css
background: var(--background-elevated)
border-left: 4px solid var(--secondary-600)
border-radius: var(--radius-lg)
padding: var(--spacing-4)
display: grid
grid-template-columns: auto 1fr auto
gap: var(--spacing-4)
align-items: center
transition: all 0.2s ease

.session-number {
  background: var(--primary-700)
  color: var(--text-primary)
  width: 48px
  height: 48px
  border-radius: var(--radius-lg)
  display: flex
  align-items: center
  justify-content: center
  font-weight: var(--font-bold)
  font-size: var(--text-lg)
}

.session-info {
  h3 {
    font-size: var(--text-lg)
    font-weight: var(--font-semibold)
    color: var(--text-primary)
    margin-bottom: var(--spacing-1)
  }
  
  p {
    font-size: var(--text-sm)
    color: var(--text-secondary)
  }
}

&:hover {
  background: var(--background-elevated-hover)
  border-left-color: var(--secondary-500)
}
```

### Transcript Viewer
```css
background: var(--background-elevated)
border: 1px solid var(--border-default)
border-radius: var(--radius-xl)
padding: var(--spacing-6)
max-height: 600px
overflow-y: auto
font-family: var(--font-body)
line-height: var(--leading-relaxed)

/* Custom scrollbar */
&::-webkit-scrollbar {
  width: 8px
}

&::-webkit-scrollbar-track {
  background: var(--background-subtle)
  border-radius: var(--radius-full)
}

&::-webkit-scrollbar-thumb {
  background: var(--border-strong)
  border-radius: var(--radius-full)
}

&::-webkit-scrollbar-thumb:hover {
  background: var(--primary-700)
}

/* Timestamp markers */
.timestamp {
  color: var(--secondary-600)
  font-family: var(--font-mono)
  font-size: var(--text-xs)
  font-weight: var(--font-semibold)
  display: inline-block
  margin-right: var(--spacing-2)
}

/* Highlighted text (search results) */
mark {
  background: rgba(245, 158, 11, 0.3)
  color: var(--text-primary)
  padding: 2px 4px
  border-radius: var(--radius-sm)
}
```

---

## Accessibility Requirements

### Focus States
All interactive elements must have visible focus states:
```css
:focus-visible {
  outline: 2px solid var(--primary-600)
  outline-offset: 2px
  border-radius: var(--radius-base)
}
```

### Color Contrast
- Text on dark backgrounds: minimum 7:1 contrast ratio (AAA)
- Interactive elements: minimum 3:1 contrast ratio
- Test all color combinations with WebAIM contrast checker

### Text Sizing
- All text must be resizable up to 200% without breaking layout
- Use `rem` units for all font sizes
- Never use `px` for fonts

### Screen Reader Support
- All images must have `alt` text
- All interactive elements must have labels
- Use semantic HTML (`<nav>`, `<main>`, `<article>`, etc.)
- ARIA labels where needed

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Logical tab order
- Skip links for main content
- Modal traps focus when open

---

## Implementation Notes for Claude Code

### Tailwind CSS Configuration
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#dc2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        background: {
          base: '#0a0a0a',
          elevated: '#171717',
          subtle: '#262626',
        }
      },
      fontFamily: {
        heading: ['Cinzel', 'Garamond', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(220, 38, 38, 0.5)',
      }
    }
  }
}
```

### Using shadcn/ui
All components should be built using shadcn/ui as the base, then customized with the D&D theme. Install with:
```bash
npx shadcn-ui@latest init
```

Use these shadcn components:
- Button
- Card
- Input
- Select
- Dialog
- Toast
- Badge
- Progress
- Table
- Tabs

Customize the `components.json` to use the D&D color scheme.

### CSS Variables Setup
```css
/* globals.css */
@layer base {
  :root {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --primary: 0 73% 50%;
    --primary-foreground: 0 0% 98%;
    --secondary: 38 92% 50%;
    --secondary-foreground: 0 0% 4%;
    /* ... etc */
  }
}
```

### Component Library Priority
1. Use shadcn/ui components as base
2. Apply custom styling via Tailwind classes
3. Add D&D-specific decorative elements
4. Ensure all animations are performant (use CSS transforms, not position changes)

### Performance Considerations
- Lazy load heavy components (audio player, transcript viewer)
- Use React.memo() for expensive renders
- Optimize images (WebP format)
- Implement virtual scrolling for long session lists
- Debounce search inputs

---

## Brand Voice & Copy Tone

### Headlines
- Dramatic but not cheesy
- Example: "Chronicle Your Adventures" not "Keep track of stuff"
- Use D&D terminology: "Campaign," "Session," "Party," "Adventure"

### Button Labels
- Action-oriented: "Begin Recording," "Summon AI Recap," "Archive Session"
- Avoid generic: "Submit," "Send," "Go"

### Error Messages
- Friendly but maintain theme
- Example: "The spell fizzled! Try again." not "Error 500"
- "The session escaped! Please upload again." not "Upload failed"

### Loading States
- "Transcribing your tale..."
- "The AI is analyzing your adventure..."
- "Summoning your recap..."

---

## Final Checklist for Claude Code

When implementing this design:
- [ ] Setup Tailwind with custom config
- [ ] Install and configure shadcn/ui
- [ ] Install font families (Cinzel, Inter)
- [ ] Create CSS variables file
- [ ] Build component library following this spec
- [ ] Test all components in light AND dark mode (dark is primary)
- [ ] Verify color contrast ratios
- [ ] Test keyboard navigation
- [ ] Implement focus states
- [ ] Add loading skeletons
- [ ] Test responsive layouts on mobile, tablet, desktop
- [ ] Optimize animations for 60fps
- [ ] Add proper ARIA labels
- [ ] Test with screen reader

---

**Design Philosophy:**
"Make the user feel like they're opening an ancient spellbook to read tales of heroic adventures, but with the convenience and power of modern technology."

Every interaction should feel special and magical, but never at the expense of usability.