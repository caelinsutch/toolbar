# agent-feedback

A floating toolbar for AI agents to annotate, inspect, and provide feedback on web pages. Features accessibility audits, layout shift detection, screen reader preview, React component detection, and element annotation.

## Installation

### CDN / Script Tag (Easiest)

Add a single script tag to any page - no build step required. React is bundled, so no dependencies needed:

```html
<script src="https://unpkg.com/agent-feedback/dist/cdn.global.js"></script>
```

Or via jsDelivr:
```html
<script src="https://cdn.jsdelivr.net/npm/agent-feedback/dist/cdn.global.js"></script>
```

The toolbar auto-mounts when the page loads and appears in the bottom-right corner. The styles are isolated so they won't conflict with your page's CSS.

**Optional: Toggle with keyboard shortcut**
```html
<script
  src="https://unpkg.com/agent-feedback/dist/cdn.global.js"
  data-options='{"activationKey":"Alt+t"}'
></script>
```

**JavaScript API (CDN):**
```javascript
// Mount/unmount programmatically
window.AgentFeedback.mount()
window.AgentFeedback.unmount()
```

**Bundle size:** ~240 KB gzipped (includes React)

### NPM Package

```bash
npm install agent-feedback bippy
# or
bun add agent-feedback bippy
# or
yarn add agent-feedback bippy
```

## Setup

**Important**: For React component detection to work, `bippy` must be imported **before** React in your application entry point.

### Vite / Create React App

```tsx
// src/main.tsx or src/index.tsx
import 'bippy'  // MUST be first!
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Toolbar } from 'agent-feedback'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Toolbar />
  </React.StrictMode>
)
```

### Next.js 15.3+

Create an instrumentation file in your project root or `src` folder:

```ts
// instrumentation-client.ts
import 'bippy'
```

Then add the toolbar to your layout:

```tsx
// app/layout.tsx
import { Toolbar } from 'agent-feedback'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toolbar />
      </body>
    </html>
  )
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌥S` (Option+S) | Open toolbar & activate element selector |
| `⌥C` (Option+C) | Copy all annotations to clipboard |
| `Escape` | Close current panel or collapse toolbar |

## Features

### Element Selection & Annotation
Click the cursor icon (or press `⌥S`) to enable element selection mode. Click any element to add annotations with comments. Copy all annotations with `⌥C` for easy sharing.

### React Component Detection
When hovering over elements, the toolbar shows the React component name and hierarchy (e.g., `<Button> in NavBar → Header`). This helps identify which components render which DOM elements.

### Accessibility Audits
Built-in axe-core integration for WCAG accessibility testing. Click "Run Audit" to scan your page for issues.

### Layout Shift Detection (CLS)
Monitors and visualizes Cumulative Layout Shift in real-time. Helps identify and debug layout instability issues.

### Screen Reader Preview
See how screen readers would announce your page content. Useful for testing accessibility without a full screen reader.

### Animation Controls
Pause/resume all CSS animations on the page for debugging.

## Requirements

- React 18+
- React DOM 18+
- bippy (for React component detection)

## API

```tsx
import { Toolbar } from 'agent-feedback'

// Types are also exported
import type {
  Annotation,
  LayoutShift,
  AccessibilityIssue,
} from 'agent-feedback'
```

## License

MIT
