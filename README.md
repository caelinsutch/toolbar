# agent-feedback

A floating toolbar for AI agents to annotate, inspect, and provide feedback on web pages. Features element selection, accessibility audits, layout shift detection, screen reader preview, React component detection, and animation controls.

## Quick Start (CDN)

Add a single script tag to any HTML page. No build step, no dependencies:

```html
<script src="https://unpkg.com/agent-feedback/dist/cdn.global.js"></script>
```

Or via jsDelivr:

```html
<script src="https://cdn.jsdelivr.net/npm/agent-feedback/dist/cdn.global.js"></script>
```

That's it. The toolbar auto-mounts in the bottom-right corner with all styles isolated from your page.

### Options

Pass configuration via `data-options`:

```html
<script
  src="https://unpkg.com/agent-feedback/dist/cdn.global.js"
  data-options='{"activationKey":"Alt+t"}'
></script>
```

### JavaScript API

```javascript
window.AgentFeedback.mount()
window.AgentFeedback.unmount()
```

## NPM Install

```bash
npm install agent-feedback bippy
```

`bippy` must be imported **before** React for component detection to work.

```tsx
// src/main.tsx
import 'bippy'  // Must be first
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Toolbar } from 'agent-feedback'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toolbar />
  </>
)
```

### Next.js 15.3+

```ts
// instrumentation-client.ts
import 'bippy'
```

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
| `Option+S` | Open toolbar & activate element selector |
| `Option+C` | Copy all annotations to clipboard |
| `Escape` | Close current panel or collapse toolbar |

## Features

- **Element Selection & Annotation** - Click elements to add comments. Copy all annotations for sharing.
- **React Component Detection** - Shows component name and hierarchy on hover (e.g., `<Button> in NavBar -> Header`).
- **Accessibility Audits** - Built-in axe-core WCAG testing.
- **Layout Shift Detection** - Real-time CLS monitoring.
- **Screen Reader Preview** - See how screen readers announce your content.
- **Animation Controls** - Pause/resume CSS animations.

## License

MIT
