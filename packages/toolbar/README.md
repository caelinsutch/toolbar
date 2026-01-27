# cloudflare-toolbar

A floating developer toolbar for web debugging - accessibility audits, layout shift detection, screen reader preview, React component detection, and element annotation.

## Installation

```bash
npm install cloudflare-toolbar bippy
# or
bun add cloudflare-toolbar bippy
# or
yarn add cloudflare-toolbar bippy
```

## Setup

**Important**: For React component detection to work, `bippy` must be imported **before** React in your application entry point.

### Vite / Create React App

```tsx
// src/main.tsx or src/index.tsx
import 'bippy'  // MUST be first!
import React from 'react'
import { createRoot } from 'react-dom/client'
import { Toolbar } from 'cloudflare-toolbar'
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
import { Toolbar } from 'cloudflare-toolbar'

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

## Features

### React Component Detection
When hovering over elements, the toolbar shows the React component name and hierarchy (e.g., `<Button> in NavBar → Header`). This helps identify which components render which DOM elements.

### Element Selection & Annotation
Click the cursor icon to enable element selection mode. Click any element to add annotations with comments. The toolbar captures both DOM info and React component context.

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
import { Toolbar } from 'cloudflare-toolbar'

// Types are also exported
import type {
  Annotation,
  LayoutShift,
  AccessibilityIssue,
} from 'cloudflare-toolbar'
```

## Development Only

This toolbar is intended for development use. For production builds, consider conditionally rendering:

```tsx
{process.env.NODE_ENV === 'development' && <Toolbar />}
```

## License

MIT
