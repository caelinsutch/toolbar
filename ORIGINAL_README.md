# Cloudflare Toolbar

A Vercel Toolbar-inspired developer tool built on Cloudflare's edge infrastructure. This toolbar provides performance monitoring, accessibility auditing, and collaboration features for web applications deployed on Cloudflare.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
  - [Layout Shift Detection](#1-layout-shift-detection)
  - [Interaction Timing (INP)](#2-interaction-timing-inp)
  - [Accessibility Audit](#3-accessibility-audit)
  - [Open Graph Preview](#4-open-graph-preview)
  - [Comments System](#5-comments-system)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Implementation Phases](#implementation-phases)
- [Getting Started](#getting-started)

---

## Overview

The Cloudflare Toolbar assists in the iteration and development process by providing real-time insights into performance metrics, accessibility compliance, and social media previews. It's designed to work seamlessly with Cloudflare Pages, Workers, and other Cloudflare services.

### Key Benefits

- **Edge-native**: Built on Cloudflare Workers, KV, D1, and Durable Objects
- **Real-time collaboration**: Comments and feedback with WebSocket sync
- **Zero-config**: Works automatically on preview deployments
- **Framework agnostic**: SDKs for React, Next.js, Nuxt, Astro, and vanilla JS

---

## Features

### 1. Layout Shift Detection

Detect, visualize, and replay Cumulative Layout Shift (CLS) events to identify elements causing unexpected page movement.

#### Capabilities

- Real-time detection of layout shifts using the PerformanceObserver API
- Visual highlighting of shifted elements with bounding boxes
- Replay functionality to animate and review shifts
- Impact scoring with filtering thresholds (0.01, 0.10, 0.25)
- Automatic descriptions (e.g., "became taller when text changed and shifted another element")
- Per-element disable option via `data-toolbar-ignore-shift` attribute

#### Implementation

```typescript
interface LayoutShift {
  id: string;
  value: number; // CLS contribution
  timestamp: number;
  hadRecentInput: boolean;
  sources: Array<{
    node: Element | null;
    previousRect: DOMRect;
    currentRect: DOMRect;
  }>;
  description?: string;
}
```

**Observer Setup:**

```typescript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      // Only count shifts without recent user input
      clsValue += entry.value;
      
      // Track shifted elements for visualization
      entry.sources?.forEach(source => {
        highlightElement(source.node, source.previousRect, source.currentRect);
      });
    }
  }
}).observe({ type: 'layout-shift', buffered: true });
```

**Replay Feature:**

The replay system stores element positions before and after each shift, then animates ghost elements showing the movement when the user triggers a replay.

---

### 2. Interaction Timing (INP)

Track Interaction to Next Paint metrics to optimize page responsiveness.

#### Capabilities

- Monitor all click, tap, and keyboard interactions
- Break down each interaction into three phases:
  - **Input Delay**: Time between user input and browser processing start
  - **Processing Time**: Time spent executing event handlers
  - **Presentation Delay**: Time for layout recalculation and painting
- Calculate and display session INP score
- Color-coded severity indicators:
  - 🟢 Green: < 200ms (Good)
  - 🟡 Yellow: 200-500ms (Needs Improvement)
  - 🔴 Red: > 500ms (Poor)

#### Implementation

```typescript
interface Interaction {
  id: string;
  type: 'click' | 'keydown' | 'pointerdown';
  target: string; // CSS selector of interacted element
  timestamp: number;
  duration: number;
  inputDelay: number;
  processingTime: number;
  presentationDelay: number;
}
```

**Observer Setup:**

```typescript
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    const interaction: Interaction = {
      id: crypto.randomUUID(),
      type: entry.name,
      target: getSelector(entry.target),
      timestamp: entry.startTime,
      duration: entry.duration,
      inputDelay: entry.processingStart - entry.startTime,
      processingTime: entry.processingEnd - entry.processingStart,
      presentationDelay: entry.duration - (entry.processingEnd - entry.startTime),
    };
    
    trackInteraction(interaction);
  }
}).observe({ type: 'event', buffered: true, durationThreshold: 16 });
```

**Visualization:**

- Horizontal stacked bar chart showing the three phases for each interaction
- Timeline view of all interactions in the session
- Highlighted INP-contributing interaction (worst latency)

---

### 3. Accessibility Audit

Automatically check Web Content Accessibility Guidelines (WCAG) 2.1 Level A and AA compliance.

#### Capabilities

- Powered by [axe-core](https://github.com/dequelabs/axe-core) accessibility engine
- Group issues by impact level:
  - 🔴 Critical
  - 🟠 Serious
  - 🟡 Moderate
  - 🔵 Minor
- Element highlighting on hover
- Console logging of failing elements on click
- **Recording mode** for testing ephemeral states (hover, focus, modals)
- Links to relevant WCAG guidelines for each issue

#### Implementation

```typescript
interface AccessibilityIssue {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  rule: {
    id: string;
    description: string;
    helpUrl: string; // Link to WCAG guideline
  };
  nodes: Array<{
    html: string;
    target: string[]; // CSS selectors
    failureSummary: string;
  }>;
}
```

**Audit Execution:**

```typescript
import axe from 'axe-core';

async function runAccessibilityAudit(): Promise<AccessibilityIssue[]> {
  const results = await axe.run(document, {
    runOnly: ['wcag2a', 'wcag2aa'],
  });
  
  return results.violations.map(violation => ({
    id: violation.id,
    impact: violation.impact,
    rule: {
      id: violation.id,
      description: violation.description,
      helpUrl: violation.helpUrl,
    },
    nodes: violation.nodes.map(node => ({
      html: node.html,
      target: node.target,
      failureSummary: node.failureSummary,
    })),
  }));
}
```

**Recording Mode:**

```typescript
function startRecording() {
  const observer = new MutationObserver(async () => {
    // Re-run audit on DOM changes during recording
    const newIssues = await runAccessibilityAudit();
    mergeIssues(newIssues);
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
  });
  
  return () => observer.disconnect();
}
```

---

### 4. Open Graph Preview

Preview how your page will appear when shared on social media platforms.

#### Capabilities

- Parse `og:*` and `twitter:*` meta tags
- Render mock previews for:
  - X (Twitter)
  - Facebook
  - LinkedIn
  - Slack
- Validate required metadata:
  - `og:title` (required)
  - `og:description` (required)
  - `og:image` (required)
  - `og:url`
  - `og:type`
  - `og:site_name`
- Image validation via Worker:
  - Accessibility check (HEAD request)
  - Dimension validation (1200x630 recommended)
  - File size check

#### Implementation

```typescript
interface OpenGraphData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  siteName?: string;
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  validation: {
    missingRequired: string[];
    warnings: string[];
    imageStatus?: 'valid' | 'missing' | 'inaccessible' | 'wrong-dimensions';
    imageDimensions?: { width: number; height: number };
  };
}
```

**Meta Tag Parser:**

```typescript
function parseOpenGraphTags(): OpenGraphData {
  const getMeta = (property: string): string | undefined => {
    const el = document.querySelector(
      `meta[property="${property}"], meta[name="${property}"]`
    );
    return el?.getAttribute('content') || undefined;
  };
  
  const data: OpenGraphData = {
    title: getMeta('og:title'),
    description: getMeta('og:description'),
    image: getMeta('og:image'),
    url: getMeta('og:url'),
    type: getMeta('og:type'),
    siteName: getMeta('og:site_name'),
    twitter: {
      card: getMeta('twitter:card'),
      site: getMeta('twitter:site'),
      creator: getMeta('twitter:creator'),
      title: getMeta('twitter:title'),
      description: getMeta('twitter:description'),
      image: getMeta('twitter:image'),
    },
    validation: validateOpenGraph(/* ... */),
  };
  
  return data;
}
```

**Platform Preview Components:**

Each platform has specific rendering requirements:

| Platform | Image Ratio | Max Title | Max Description |
|----------|-------------|-----------|-----------------|
| Twitter (Large) | 2:1 | 70 chars | 200 chars |
| Facebook | 1.91:1 | 60 chars | 65 chars |
| LinkedIn | 1.91:1 | 200 chars | 256 chars |
| Slack | 1.91:1 | Unlimited | Unlimited |

---

### 5. Comments System

Leave feedback directly on deployments with position-anchored comments.

#### Capabilities

- Click anywhere to leave a comment anchored to coordinates + CSS selector
- Real-time sync across collaborators via Durable Objects WebSocket
- Thread support for replies
- Comment resolution workflow
- Integration webhooks for:
  - Linear
  - GitHub Issues
  - Slack
  - Jira

#### Implementation

```typescript
interface Comment {
  id: string;
  projectId: string;
  deploymentId: string;
  pageUrl: string;
  coordinates: { x: number; y: number };
  selector?: string; // CSS selector for element anchoring
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt?: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  thread?: Comment[];
}
```

**D1 Schema:**

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  deployment_id TEXT NOT NULL,
  page_url TEXT NOT NULL,
  coord_x REAL NOT NULL,
  coord_y REAL NOT NULL,
  selector TEXT,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  parent_id TEXT REFERENCES comments(id),
  resolved INTEGER DEFAULT 0,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE INDEX idx_comments_page ON comments(project_id, page_url);
CREATE INDEX idx_comments_deployment ON comments(deployment_id);
```

**Durable Object for Real-time Sync:**

```typescript
export class CommentRoom implements DurableObject {
  private sessions: Map<WebSocket, { userId: string }> = new Map();
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    if (url.pathname === '/websocket') {
      const pair = new WebSocketPair();
      await this.handleSession(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    
    return new Response('Not found', { status: 404 });
  }
  
  private async handleSession(ws: WebSocket) {
    ws.accept();
    
    ws.addEventListener('message', async (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'new_comment':
          // Broadcast to all other sessions
          this.broadcast(data, ws);
          break;
        case 'resolve_comment':
          this.broadcast(data, ws);
          break;
      }
    });
    
    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });
  }
  
  private broadcast(data: unknown, exclude?: WebSocket) {
    for (const [ws] of this.sessions) {
      if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    }
  }
}
```

---

## Technical Architecture

### Infrastructure Components

| Component | Cloudflare Service | Purpose |
|-----------|-------------------|---------|
| API Backend | Workers | REST API for all toolbar operations |
| Comment Storage | D1 (SQLite) | Persistent comment storage |
| Real-time Sync | Durable Objects | WebSocket connections for live updates |
| Session Data | KV | Temporary session and preference storage |
| Image Validation | Workers | Fetch and validate OG images |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User's Browser                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Shadow DOM Container                    │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │   Toolbar   │ │    Menu     │ │    Tool Panels      │  │  │
│  │  │   (Pill)    │ │  (Dropdown) │ │  (Layout/INP/A11y)  │  │  │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              │ API Calls                         │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTPS
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                   Worker (API Router)                      │  │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │  │
│  │  │  Comments   │ │ OG Validate │ │       Auth          │  │  │
│  │  │   Routes    │ │   Routes    │ │      Routes         │  │  │
│  │  └──────┬──────┘ └─────────────┘ └─────────────────────┘  │  │
│  └─────────┼─────────────────────────────────────────────────┘  │
│            │                                                     │
│            ▼                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │       D1        │  │  Durable Object │  │       KV        │  │
│  │   (Comments)    │  │  (WebSocket)    │  │   (Sessions)    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Client-Side Architecture

The toolbar uses Shadow DOM for complete style isolation from the host page:

```typescript
class ToolbarInjector {
  private shadow: ShadowRoot;
  private container: HTMLElement;
  
  inject() {
    // Create container element
    this.container = document.createElement('cloudflare-toolbar');
    document.body.appendChild(this.container);
    
    // Attach shadow DOM for style isolation
    this.shadow = this.container.attachShadow({ mode: 'closed' });
    
    // Inject styles and render toolbar
    this.shadow.innerHTML = `
      <style>${toolbarStyles}</style>
      <div id="toolbar-root"></div>
    `;
    
    // Mount Preact app
    render(<Toolbar />, this.shadow.getElementById('toolbar-root'));
  }
}
```

---

## Project Structure

```
cloudflare-toolbar/
├── packages/
│   ├── toolbar-ui/                 # Main toolbar client
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── Toolbar.tsx         # Main toolbar pill
│   │   │   │   ├── Menu.tsx            # Dropdown menu
│   │   │   │   ├── Panel.tsx           # Slide-out panel container
│   │   │   │   ├── Badge.tsx           # Notification badges
│   │   │   │   └── Button.tsx          # Reusable button
│   │   │   ├── tools/
│   │   │   │   ├── layout-shift/
│   │   │   │   │   ├── observer.ts     # PerformanceObserver setup
│   │   │   │   │   ├── visualizer.ts   # Element highlighting
│   │   │   │   │   ├── replay.ts       # Shift replay animation
│   │   │   │   │   └── LayoutShiftPanel.tsx
│   │   │   │   ├── interaction-timing/
│   │   │   │   │   ├── observer.ts     # Event timing observer
│   │   │   │   │   ├── calculator.ts   # INP calculation
│   │   │   │   │   └── InteractionPanel.tsx
│   │   │   │   ├── accessibility/
│   │   │   │   │   ├── auditor.ts      # axe-core integration
│   │   │   │   │   ├── recorder.ts     # Recording mode
│   │   │   │   │   └── AccessibilityPanel.tsx
│   │   │   │   ├── opengraph/
│   │   │   │   │   ├── parser.ts       # Meta tag parsing
│   │   │   │   │   ├── validator.ts    # OG validation logic
│   │   │   │   │   ├── previews/
│   │   │   │   │   │   ├── TwitterCard.tsx
│   │   │   │   │   │   ├── FacebookCard.tsx
│   │   │   │   │   │   ├── LinkedInCard.tsx
│   │   │   │   │   │   └── SlackCard.tsx
│   │   │   │   │   └── OpenGraphPanel.tsx
│   │   │   │   └── comments/
│   │   │   │       ├── api.ts          # Comments API client
│   │   │   │       ├── websocket.ts    # Real-time sync
│   │   │   │       ├── CommentPin.tsx  # Page overlay pins
│   │   │   │       ├── CommentThread.tsx
│   │   │   │       └── CommentsPanel.tsx
│   │   │   ├── core/
│   │   │   │   ├── injector.ts         # Shadow DOM injection
│   │   │   │   ├── store.ts            # State management (Zustand)
│   │   │   │   ├── api.ts              # Worker API client
│   │   │   │   ├── keyboard.ts         # Keyboard shortcuts
│   │   │   │   └── preferences.ts      # User preferences
│   │   │   ├── styles/
│   │   │   │   ├── toolbar.css         # Main styles
│   │   │   │   ├── variables.css       # CSS custom properties
│   │   │   │   └── themes/
│   │   │   │       ├── light.css
│   │   │   │       └── dark.css
│   │   │   └── index.ts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   ├── toolbar-worker/              # Cloudflare Worker backend
│   │   ├── src/
│   │   │   ├── index.ts             # Main entry, Hono router
│   │   │   ├── routes/
│   │   │   │   ├── comments.ts      # CRUD for comments
│   │   │   │   ├── og-validate.ts   # OG image validation
│   │   │   │   ├── projects.ts      # Project management
│   │   │   │   └── auth.ts          # Authentication
│   │   │   ├── durable-objects/
│   │   │   │   └── CommentRoom.ts   # Real-time WebSocket
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts          # Auth middleware
│   │   │   │   └── cors.ts          # CORS handling
│   │   │   └── db/
│   │   │       ├── schema.sql       # D1 schema
│   │   │       └── queries.ts       # Type-safe queries
│   │   ├── wrangler.toml
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── toolbar-sdk/                 # Framework integrations
│       ├── src/
│       │   ├── core.ts              # Core mounting logic
│       │   ├── vanilla.ts           # Vanilla JS
│       │   ├── react.tsx            # React component
│       │   ├── next.ts              # Next.js integration
│       │   ├── nuxt.ts              # Nuxt module
│       │   └── astro.ts             # Astro integration
│       ├── package.json
│       └── tsconfig.json
│
├── apps/
│   ├── demo/                        # Demo site for testing
│   │   ├── src/
│   │   ├── package.json
│   │   └── wrangler.toml
│   └── docs/                        # Documentation site
│
├── turbo.json                       # Turborepo config
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

**Goals:**
- Set up monorepo with Turborepo and pnpm
- Create Shadow DOM injection system with style isolation
- Build toolbar shell with draggable positioning
- Implement keyboard shortcut system
- Basic Worker setup with Hono router
- Authentication flow (optional: Cloudflare Access)

**Deliverables:**
- [ ] Monorepo scaffolding
- [ ] Toolbar component with open/close states
- [ ] Menu dropdown with tool list
- [ ] Keyboard shortcuts (Ctrl to toggle, customizable)
- [ ] Position persistence (localStorage)
- [ ] Worker with health check endpoint

### Phase 2: Layout Shift Tool (Week 2)

**Goals:**
- Implement PerformanceObserver for layout-shift entries
- Build shift visualization with bounding box overlays
- Create replay animation system
- Add filtering by impact threshold
- Generate human-readable shift descriptions

**Deliverables:**
- [ ] Layout shift observer
- [ ] Real-time CLS score display
- [ ] Element highlighting
- [ ] Replay functionality
- [ ] Shift list with details
- [ ] Impact threshold filter

### Phase 3: Interaction Timing Tool (Week 2-3)

**Goals:**
- Implement event PerformanceObserver
- Calculate and display INP score
- Build timeline visualization
- Show three-phase breakdown for each interaction
- Color-code by severity

**Deliverables:**
- [ ] Interaction observer
- [ ] INP calculation and display
- [ ] Interaction timeline UI
- [ ] Phase breakdown visualization
- [ ] Target element identification

### Phase 4: Accessibility Audit (Week 3)

**Goals:**
- Integrate axe-core with dynamic loading
- Filter to WCAG 2.1 A/AA rules
- Group issues by impact
- Implement element highlighting
- Build recording mode for ephemeral states

**Deliverables:**
- [ ] axe-core integration
- [ ] Issue list grouped by impact
- [ ] Element highlighting on hover
- [ ] Console logging on click
- [ ] Recording mode
- [ ] WCAG reference links

### Phase 5: Open Graph Tool (Week 4)

**Goals:**
- Build meta tag parser
- Create platform-specific preview components
- Implement validation logic
- Add Worker endpoint for image validation
- Display warnings for missing/invalid metadata

**Deliverables:**
- [ ] OG meta tag parser
- [ ] Twitter card preview
- [ ] Facebook preview
- [ ] LinkedIn preview
- [ ] Slack preview
- [ ] Image validation endpoint
- [ ] Missing metadata warnings

### Phase 6: Comments System (Week 4-5)

**Goals:**
- Design and implement D1 schema
- Build Worker routes for CRUD operations
- Create Durable Object for real-time sync
- Implement comment pin placement UI
- Add thread support and resolution workflow

**Deliverables:**
- [ ] D1 schema and migrations
- [ ] Comments API routes
- [ ] Durable Object WebSocket
- [ ] Comment pins on page
- [ ] Thread UI
- [ ] Resolution workflow
- [ ] Integration webhooks (Linear, GitHub, Slack)

### Phase 7: SDK & Polish (Week 5-6)

**Goals:**
- Create framework-specific SDK packages
- Build documentation site
- Create demo application
- Performance optimization
- Browser extension (optional)

**Deliverables:**
- [ ] Vanilla JS SDK
- [ ] React SDK
- [ ] Next.js SDK
- [ ] Nuxt SDK
- [ ] Astro SDK
- [ ] Documentation
- [ ] Demo site
- [ ] Performance audit

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Cloudflare account with Workers, D1, and Durable Objects access
- Wrangler CLI

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/cloudflare-toolbar.git
cd cloudflare-toolbar

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize D1 database
pnpm run db:init

# Start development
pnpm run dev
```

### Usage

#### Vanilla JavaScript

```html
<script src="https://toolbar.example.com/toolbar.js"></script>
<script>
  CloudflareToolbar.init({
    projectId: 'your-project-id',
  });
</script>
```

#### React

```tsx
import { CloudflareToolbar } from '@cloudflare-toolbar/react';

export default function App() {
  return (
    <>
      <YourApp />
      {process.env.NODE_ENV === 'development' && (
        <CloudflareToolbar projectId="your-project-id" />
      )}
    </>
  );
}
```

#### Next.js

```tsx
// next.config.js
const withCloudflareToolbar = require('@cloudflare-toolbar/next')({
  projectId: 'your-project-id',
  enableInProduction: false,
});

module.exports = withCloudflareToolbar({
  // your Next.js config
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `projectId` | `string` | required | Your Cloudflare toolbar project ID |
| `enableInProduction` | `boolean` | `false` | Enable toolbar in production builds |
| `position` | `'bottom-left' \| 'bottom-right' \| 'top-left' \| 'top-right'` | `'bottom-left'` | Initial toolbar position |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Color theme |
| `tools` | `string[]` | all | Tools to enable |
| `shortcuts` | `Record<string, string>` | defaults | Custom keyboard shortcuts |

---

## API Reference

### Worker Endpoints

#### Comments

```
GET    /api/comments?projectId=...&pageUrl=...
POST   /api/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/comments/:id/resolve
```

#### Open Graph Validation

```
POST   /api/og/validate
Body: { imageUrl: string }
Response: { valid: boolean, dimensions?: { width, height }, error?: string }
```

#### WebSocket (Durable Object)

```
GET    /api/rooms/:projectId/websocket
Upgrade: websocket

Messages:
- { type: 'new_comment', comment: Comment }
- { type: 'update_comment', comment: Comment }
- { type: 'delete_comment', commentId: string }
- { type: 'resolve_comment', commentId: string, resolvedBy: string }
```

---

## License

MIT
