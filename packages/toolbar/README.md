# cloudflare-toolbar

A floating developer toolbar for web debugging - accessibility audits, layout shift detection, screen reader preview, and element annotation.

## Installation

```bash
npm install cloudflare-toolbar
# or
bun add cloudflare-toolbar
# or
yarn add cloudflare-toolbar
```

## Usage

Simply import and render the `Toolbar` component anywhere in your React application:

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

The toolbar will appear as a floating button in the bottom-right corner. Click to expand and access all features.

## Features

### Element Selection & Annotation
Click the cursor icon to enable element selection mode. Click any element to add annotations with comments.

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

## License

MIT
