# The Lost Temple Adventure - Visual Style Guide

> **Theme:** 80's Dark Fantasy
> **Inspiration:** Labyrinth, The Dark Crystal, Legend, Neverending Story
> **Aesthetic:** Ancient mysteries, mystical trials, cryptic guardians, weathered artifacts

---

## Color Palette

### Primary Dark Fantasy Colors

Our color system evokes torchlit temples, weathered bronze, and mystical energies:

```css
/* Deep Voids & Shadows */
--temple-void: #0a0612        /* Deep void black-purple */
--temple-shadow: #1a0f2e      /* Dark purple shadow */
--temple-dusk: #2d1b3d        /* Dusky purple */
--temple-mystic: #4a2c5c      /* Mystic purple */

/* Warm Flames & Embers */
--temple-ember: #d2691e       /* Burnt orange ember */
--temple-flame: #ff6b35       /* Orange flame */

/* Ancient Metals */
--temple-bronze: #8b6f47      /* Weathered bronze */
--temple-gold: #d4af37        /* Ancient gold */

/* Mystical Greens */
--temple-jade: #3d6b5a        /* Mysterious jade green */
--temple-moss: #5a7d6f        /* Forest moss */

/* Sacred Crimson */
--temple-seal: #7c3f58        /* Sealed door crimson */

/* Aged Materials */
--temple-parchment: #e8dcc4   /* Aged parchment */
```

### NFT/Map Preserved Colors

The Adventure Map NFT maintains warm parchment tones for contrast against dark UI:

```css
/* Parchment/Paper */
#fef3c7                       /* Light cream parchment */
#d97706                       /* Amber accent */

/* Border/Frame */
#92400e                       /* Dark brown border */

/* Waypoint States */
#e8f5e8                       /* Light green (complete circle) */
#5a8a5a                       /* Muted green (complete icon) */
#f5e8d8                       /* Cream (incomplete circle) */
#8b6f47                       /* Warm brown (incomplete icon) */

/* Level Badges */
#15803d                       /* Green badge (complete) */
#78350f                       /* Brown badge (incomplete) */
```

---

## Typography

### Fonts

```css
--font-heading: "Cinzel", serif;     /* Ancient inscriptions, formal titles */
--font-sans: "Crimson Pro", Georgia, serif;  /* Body text, descriptions */
```

**Usage:**
- **Headings** (`font-heading`): Titles, level names, mystical proclamations
- **Body** (`font-sans`): Instructions, descriptions, general UI text
- **Monospace**: Codeword inputs (inherits from browser)

### Text Styling Patterns

- **Titles**: Gold color (`text-temple-gold`), bold, heading font
- **Subtitles**: Parchment with opacity (`text-temple-parchment/90`)
- **Body text**: Parchment with varying opacity (`text-temple-parchment/80`)
- **Accents**: Ember/flame for headers (`text-temple-ember`)
- **Success states**: Jade/moss (`text-temple-jade`, `text-temple-moss`)
- **Locked/disabled**: Bronze (`text-temple-bronze`)
- **Errors**: Flame (`text-temple-flame`)

---

## Component Patterns

### Card Style

Dark fantasy cards use layered translucency and mystical gradients:

```tsx
<div className="bg-temple-dusk/40 border-2 border-temple-bronze rounded-lg p-6 shadow-xl relative overflow-hidden backdrop-blur-sm">
  {/* Mystical background gradient */}
  <div className="absolute inset-0 bg-gradient-to-br from-temple-mystic/20 to-transparent pointer-events-none"></div>

  <div className="relative">
    {/* Card content */}
  </div>
</div>
```

**Key characteristics:**
- Translucent dark background (`temple-dusk/40`)
- Bronze borders (`border-temple-bronze`)
- Backdrop blur for depth
- Subtle mystical gradient overlay
- Relative positioning for content layer

### Button Patterns

#### Primary Action (Challenge Entry)
```tsx
className="bg-gradient-to-r from-temple-ember to-temple-flame
  hover:from-temple-flame hover:to-temple-ember
  text-white font-semibold py-3 px-4 rounded-lg
  transition-all border-2 border-temple-bronze/50
  hover:border-temple-gold shadow-lg"
```

#### Secondary Action (Quest Submission)
```tsx
className="bg-gradient-to-r from-temple-seal to-temple-mystic
  hover:from-temple-mystic hover:to-temple-seal
  text-white font-semibold py-3 px-4 rounded-lg
  transition-all border-2 border-temple-bronze/50
  hover:border-temple-gold shadow-lg"
```

#### Success Action (Claim Victory)
```tsx
className="bg-temple-jade hover:bg-temple-moss
  text-white font-semibold py-2 px-3 rounded
  transition-colors border border-temple-bronze/30"
```

**Button principles:**
- Gradients suggest mystical energy
- Warm colors (ember/flame) for combat/challenges
- Cool colors (seal/mystic) for puzzles/mysteries
- Bronze borders that glow gold on hover
- Shadow for depth

### Level Card States

#### Locked State
```tsx
<div className="bg-temple-shadow border-2 border-temple-dusk rounded-lg p-6 opacity-50 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-temple-void/50 to-transparent"></div>
  <div className="relative text-center text-temple-bronze">
    <div className="text-4xl mb-2">🔒</div>
    <p className="font-semibold italic">{lockText}</p>
  </div>
</div>
```

#### Active State
Uses full card pattern with mystical overlay (see Card Style above)

#### Completed State
```tsx
<div className="bg-temple-jade/20 border-2 border-temple-jade rounded-lg p-6 relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-temple-jade/10 to-transparent"></div>
  <div className="relative text-center text-temple-jade">
    <div className="text-4xl mb-2">✓</div>
    <p className="font-semibold text-lg font-heading">{levelName}</p>
    <p className="text-sm text-temple-moss mt-1">{statusText}</p>
  </div>
</div>
```

#### Success Animation
```tsx
<div className="bg-temple-jade/20 border-2 border-temple-gold rounded-lg p-6 animate-pulse relative overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-temple-gold/20 to-transparent"></div>
  <div className="relative text-center text-temple-gold">
    <div className="text-5xl mb-3">{icon}</div>
    <p className="font-bold text-xl font-heading">{successMessage}</p>
  </div>
</div>
```

### Info Boxes

#### Requirements/Trial Info
```tsx
<div className="bg-temple-shadow/60 border-2 border-temple-ember/30 rounded-lg p-4">
  <h4 className="font-semibold text-temple-ember mb-2">{title}</h4>
  <ul className="text-temple-parchment/70 text-sm space-y-1">
    {/* List items */}
  </ul>
</div>
```

#### Location/Quest Info
```tsx
<div className="bg-temple-shadow/60 border-2 border-temple-seal/30 rounded-lg p-4">
  <h4 className="font-semibold text-temple-ember mb-2">{title}</h4>
  <p className="text-temple-parchment/70 text-sm italic">{content}</p>
</div>
```

#### Dev Mode Info
```tsx
<div className="bg-temple-ember/20 border-2 border-temple-gold/50 rounded-lg p-4">
  <h4 className="font-semibold text-temple-gold">{title}</h4>
  <p className="text-temple-gold bg-temple-shadow px-3 py-2 rounded border border-temple-bronze/40">
    {content}
  </p>
</div>
```

### Input Fields

```tsx
<input
  className="w-full px-4 py-3 border-2 border-temple-bronze
    bg-temple-shadow/50 text-temple-parchment rounded-lg
    focus:border-temple-gold focus:outline-none
    disabled:opacity-50 text-lg font-mono uppercase
    placeholder:text-temple-bronze/50"
/>
```

**Characteristics:**
- Dark shadow background
- Bronze border (gold on focus)
- Parchment text
- Monospace for codewords
- Uppercase transformation

---

## Iconography

### Core Icons

- **Temple/Dojo**: ⛩️ (torii gate)
- **Challenge/Combat**: ⚔️ (crossed swords)
- **Quest/Mystery**: 🔮 (crystal ball)
- **Map**: 🗺️ (rolled map)
- **Locked**: 🔒 (padlock)
- **Complete**: ✓ (checkmark, not emoji)
- **Location**: 📍 (pushpin)

### Level Status Icons

- **Locked waypoint**: 🔒
- **Active challenge**: ⚔️
- **Active quest**: 🔮
- **Completed challenge**: ✓ + "Seal Broken"
- **Completed quest**: 🔮 + "Waypoint Discovered"
- **Success animation**: ⚔️ (challenge) or 🔮 (quest)

---

## Layout Patterns

### Main Dashboard Grid

```tsx
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
  {/* Map: 5 columns (5/12 = ~42%) */}
  <div className="lg:col-span-5">
    <div className="sticky top-4">
      <AdventureMapNFT />
    </div>
  </div>

  {/* Level Cards: 7 columns (7/12 = ~58%) */}
  <div className="lg:col-span-7">
    {/* Level cards */}
  </div>
</div>
```

**Principles:**
- 5:7 ratio (map:levels)
- Sticky map for reference while scrolling
- Single column on mobile
- Generous gap (gap-8)

### Page Background

```tsx
<div className="min-h-screen bg-gradient-to-br from-temple-void via-temple-shadow to-temple-dusk">
  <div className="min-h-screen bg-temple-void/30">
    {/* Content */}
  </div>
</div>
```

**Layered backgrounds:**
1. Gradient (void → shadow → dusk)
2. Semi-transparent overlay (void/30)
3. Content with individual card backgrounds

---

## Animation & Transitions

### Standard Transitions

```css
transition-all duration-300      /* Smooth all-property transitions */
transition-colors duration-150   /* Quick color changes */
transition-all duration-500      /* Slower progress bar fills */
```

### Loading States

```tsx
<div className="inline-block animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-temple-gold"></div>
```

### Success States

```tsx
className="animate-pulse"   /* Pulsing gold borders and text */
```

### Hover States

- **Borders**: `border-temple-bronze/50 hover:border-temple-gold`
- **Backgrounds**: Gradient direction reversal on hover
- **Colors**: Text brightening (bronze → gold)

---

## Spacing & Sizing

### Card Padding
- Large cards: `p-6` to `p-12`
- Info boxes: `p-4`
- Buttons: `px-4 py-3`

### Gaps & Margins
- Grid gap: `gap-8`
- Card spacing: `space-y-6`
- List spacing: `space-y-2`
- Section margins: `mb-4`, `mt-4`

### Border Width
- Primary borders: `border-2`
- Secondary borders: `border`
- Accent glows: `border-2` on hover

### Border Radius
- Cards: `rounded-lg`
- Buttons: `rounded-lg`
- Input fields: `rounded-lg`
- Small elements: `rounded` or `rounded-full`

---

## Design Principles

### 1. Layered Depth
Create mystical atmosphere through:
- Translucent overlays
- Backdrop blur
- Multiple gradient layers
- Shadow effects

### 2. Weathered Authenticity
Evoke ancient artifacts:
- Bronze accents (not shiny chrome)
- Parchment textures (warm, aged)
- Muted colors (not bright/saturated)
- Serif fonts (not modern sans)

### 3. Mystical Energy
Suggest magic without being whimsical:
- Gradient animations (subtle energy flow)
- Pulsing glows (contained power)
- Gold accents (divine/sacred)
- Purple depths (mysterious forces)

### 4. Torchlit Darkness
Balance dark UI with warm accents:
- Deep purple/black backgrounds
- Ember/flame highlights
- Bronze/gold metallics
- Parchment contrast

### 5. Progressive Disclosure
Guide attention through hierarchy:
- Gold for primary focus (titles, CTAs)
- Ember for section headers
- Parchment for content
- Bronze for secondary info
- Jade for success states

---

## Tone & Voice

### Visual Metaphors

**Onchain Challenges = Breaking Seals**
- Magical barriers protecting knowledge
- Ancient guardians testing worthiness
- Triumphant breakthrough

**IRL Quests = Discovering Waypoints**
- Physical journey through space
- Hidden markers on the path
- Explorer's satisfaction

### Language Patterns

**Mystical but Grounded:**
- ✅ "The guardian tests your knowledge"
- ❌ "Magic spell verification in progress"

**Formal but Approachable:**
- ✅ "Speak the Ancient Word"
- ❌ "Enter password"

**Dark but Not Hostile:**
- ✅ "The path grows dark"
- ❌ "You have failed"

---

## Technical Implementation

### Tailwind Configuration

Colors are defined in `src/index.css`:

```css
@theme {
  /* Temple colors defined as CSS variables */
  --color-temple-void: #0a0612;
  /* ... etc */
}
```

Used in components as:
```tsx
className="bg-temple-void text-temple-gold border-temple-bronze"
```

### Config File

All text content centralized in `src/lib/adventureConfig.ts`:

```typescript
export const ADVENTURE_TEXT = {
  header: { title: "The Lost Temple Adventure", ... },
  welcome: { title: "The Lost Temple Awaits", ... },
  levelCard: { locked: "Previous waypoint must be discovered", ... },
  // ... etc
}
```

### Font Loading

Fonts loaded via HTML `<link>` tags in `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400..900&family=Crimson+Pro:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
```

---

## Accessibility Considerations

### Color Contrast

- Parchment text on dark backgrounds: WCAG AA compliant
- Gold text on dark backgrounds: High contrast for readability
- Bronze used for secondary info (not primary CTAs)

### Keyboard Navigation

- All interactive elements accessible via Tab
- Focus states use gold borders (distinct from hover)
- Disabled states clearly indicated (opacity-50)

### Motion Sensitivity

- Animations are subtle (no rapid flashing)
- Pulse effect is gentle (for success states only)
- Transitions are smooth, not jarring

---

## Future Considerations

### Potential Enhancements

- **Weathered textures**: Add subtle noise/grain to cards for aged paper effect
- **Particle effects**: Floating embers/dust motes in backgrounds
- **Torch flicker**: Subtle brightness variations in gold/ember colors
- **Ancient runes**: Decorative glyphs on borders/corners
- **Torn edges**: Irregular borders for parchment-like feel

### Responsive Refinements

- Adjust gradient overlays for better mobile contrast
- Optimize font sizes for small screens
- Consider single-column layouts with reduced padding

---

*This style guide captures the visual identity of The Lost Temple Adventure as of January 2025. All components follow these patterns to maintain a cohesive 80's dark fantasy aesthetic.*
