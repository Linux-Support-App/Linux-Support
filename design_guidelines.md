# Linux Support Forum - Design Guidelines

## Design Approach

**Selected Approach:** Design System (Utility-Focused)
**Justification:** Forum platforms prioritize information density, readability, and efficient navigation. Drawing inspiration from Stack Overflow, Reddit, and GitHub Discussions for proven Q&A patterns.

**Core Principles:**
- Information hierarchy: Questions, answers, and metadata must be instantly scannable
- Functional clarity: Every UI element serves a clear purpose
- Technical readability: Code snippets and terminal commands require special treatment
- Community-focused: Voting, replies, and contribution patterns are prominent

---

## Brand Colors

**Primary Palette:** Orange and black as specified
**Mode Requirements:** Full dark/light mode toggle with persistent user preference
**Application:** Orange for primary actions, highlights, and active states; black/dark grays for structure in light mode

---

## Typography System

**Font Stack:**
- **Primary:** Inter or System UI stack (IBM Plex Sans via Google Fonts as alternative)
- **Monospace:** JetBrains Mono or Fira Code for all code blocks and terminal commands

**Type Scale:**
- Headings: text-3xl (question titles), text-xl (section headers), text-lg (answer headers)
- Body: text-base (standard content), text-sm (metadata, timestamps, vote counts)
- Code: text-sm (inline code), text-xs (line numbers)
- UI: text-sm (buttons, navigation), text-xs (tags, badges)

**Weights:** Regular (400) for body, Medium (500) for emphasis, Semibold (600) for headings, Bold (700) for critical CTAs

---

## Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24
- Micro spacing: p-2, gap-2 (between inline elements, tags)
- Standard spacing: p-4, gap-4 (card padding, list item gaps)
- Section spacing: py-8, py-12 (between major sections)
- Container spacing: px-4 md:px-6 lg:px-8 (page margins)

**Grid Structure:**
- Main layout: Sidebar navigation (w-64) + Content area (flex-1) + Optional right sidebar (w-80) for related questions
- Mobile: Stack to single column, collapsible hamburger navigation
- Content max-width: max-w-4xl for readability, max-w-6xl for dashboard views

**Container Strategy:**
- Forum posts: Full-width with inner max-w-5xl centered container
- FAQ section: max-w-6xl with 2-column grid on desktop (grid-cols-1 md:grid-cols-2)
- Question detail: Single column max-w-4xl for optimal reading

---

## Component Library

### Navigation
- **Top Header:** Sticky navigation with logo, search bar (prominent center position), theme toggle, category dropdown
- **Sidebar:** Category list with icon + label, post count badges, collapsible on mobile
- **Breadcrumbs:** Show navigation path (Home > Category > Question)

### Forum Post Cards
- **Structure:** Vertical card layout with clear visual separation
- **Elements:** Vote count (left column), question title (large, bold), preview text (2 lines truncated), metadata row (author, timestamp, category tag, answer count, view count)
- **Spacing:** p-6, gap-4 between elements
- **Tags:** Rounded badges (rounded-full px-3 py-1) with category colors

### Question Detail Page
- **Layout:** Full question at top, answer list below, "Post Answer" form at bottom
- **Question Block:** Title (text-3xl font-bold), author card, timestamp, vote buttons (large, vertical), question body with rich content support, tag row, action buttons (share, bookmark, follow)
- **Answer Cards:** Similar structure to questions but with text-xl title, accepted answer highlight (border treatment), vote buttons, author info, timestamp

### Media Components
- **Image Display:** Full-width within content area, rounded-lg, shadow, click to expand lightbox
- **Video Embed:** Responsive 16:9 aspect ratio container, rounded-lg borders
- **Code Blocks:** Dark background in both themes, syntax highlighting via Prism.js, line numbers (optional toggle), copy button (top-right corner), language badge (top-left)

### Forms
- **Post Question:** Multi-step form feel - Title input (text-xl), rich text editor for body, category select dropdown, tag input (autocomplete), media upload zone (drag-drop), preview toggle
- **Answer Form:** Similar to question but simplified, prominent "Post Answer" CTA
- **Input Styling:** Consistent border treatment, focus states with orange accent, proper dark mode contrast

### Interactive Elements
- **Vote Buttons:** Large clickable targets (min 44x44px), upvote/downvote arrows, count display between
- **Category Pills:** Clickable tags with hover states, small size (px-3 py-1 text-xs)
- **Action Buttons:** Primary (orange), secondary (outline), ghost (text only), all with proper hover/active states
- **Search:** Autocomplete dropdown, recent searches, category filters

### FAQ Section
- **Layout:** Accordion-style expandable items or grid of cards (grid-cols-1 md:grid-cols-2 gap-6)
- **Card Structure:** Question as heading, collapsed preview, expand to show full answer with code examples and images
- **Organization:** Group by category with visual separators

---

## Dark/Light Mode Implementation

**Toggle Mechanism:** Icon button in header (sun/moon icons), instant switch with smooth transition
**Persistence:** Store preference in localStorage, respect system preference on first visit
**Contrast Requirements:** Maintain WCAG AA standards in both modes, test code blocks especially
**Mode-Specific Treatments:**
- Light: White backgrounds, dark text, subtle gray borders
- Dark: Deep black/dark gray backgrounds, light text, subtle highlight borders
- Code blocks: Dark in both modes (better for readability)

---

## Media Handling Patterns

**Upload Interface:** Drag-drop zone with file browser fallback, show preview thumbnails, display file size/type, progress indicator during upload
**Display Rules:** Images auto-scale to container width, videos show thumbnail with play button, maintain aspect ratios
**Code Formatting:** Syntax highlighting for bash, python, javascript, C, and common Linux config files, line wrapping toggle, download snippet button

---

## Images Section

**Hero Section:** No traditional hero - immediately show forum activity
**In-Content Images:**
- FAQ section: Illustrative screenshots of Linux interfaces, terminal outputs, file managers (placed within answer cards)
- Question/Answer posts: User-uploaded screenshots of errors, configuration files, system information
- No decorative images - all images serve functional/educational purposes

---

## Accessibility & Performance

- Semantic HTML throughout (nav, main, article, aside tags)
- Keyboard navigation for all interactive elements
- Skip links for keyboard users
- Alt text required for all uploaded images
- Lazy loading for images below fold
- Virtual scrolling for long answer lists