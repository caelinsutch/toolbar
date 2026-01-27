# cloudflare-toolbar

A floating developer toolbar for web debugging - accessibility audits, layout shift detection, screen reader preview, and element annotation.

## Installation

```bash
npm install cloudflare-toolbar
# or
bun add cloudflare-toolbar
```

## Usage

Import and render the `Toolbar` component anywhere in your React application:

```tsx
import { Toolbar } from 'cloudflare-toolbar'

function App() {
  return (
    <div>
      <h1>My Application</h1>
      {/* Your app content */}
      
      {/* Add the toolbar - it will float in the corner */}
      <Toolbar />
    </div>
  )
}
```

The toolbar appears as a floating button in the bottom-right corner. Click to expand and access all features.

## Features

- **Element Selection & Annotation** - Click elements to add comments and annotations
- **Accessibility Audits** - Built-in axe-core integration for WCAG testing
- **Layout Shift Detection (CLS)** - Real-time Cumulative Layout Shift monitoring
- **Screen Reader Preview** - See how screen readers announce your content
- **Animation Controls** - Pause/resume CSS animations for debugging

## Development

This is a Turborepo monorepo.

### Prerequisites

- [Bun](https://bun.sh/)

### Setup

```bash
bun install
```

### Commands

```bash
bun run dev        # Start development servers
bun run build      # Build all packages
bun run typecheck  # Run type checking
bun run lint       # Lint all packages
```

### Structure

```
├── apps/
│   └── web/              # Demo app (Vite + React)
└── packages/
    ├── toolbar/          # Main library (cloudflare-toolbar)
    └── types/            # Shared TypeScript types
```

## Requirements

- React 18+

## License

MIT
