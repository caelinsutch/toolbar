# Cloudflare Toolbar

A Vercel Toolbar-inspired developer tool built with clean animations inspired by [agentation](https://github.com/agentation/agentation). This toolbar provides a floating UI with smooth transitions, drag-to-move functionality, and extensible tool buttons.

## ✨ Features

- 🎨 **Clean, Minimal Design** - Floating pill-style toolbar that stays out of your way
- ✨ **Smooth Animations** - Beautiful entrance animations with scale and rotation effects
- 🎯 **Draggable** - Drag the toolbar anywhere on screen with constrained boundaries
- 🔄 **Expand/Collapse** - Smooth transitions between collapsed icon and expanded controls
- 💡 **Tooltips** - Delayed tooltip hints on button hover
- 🎭 **Blur Effects** - Smooth blur transitions on state changes
- 📦 **Zero Runtime Dependencies** - Pure CSS animations, no animation libraries needed

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or later
- Node.js 18+ (for compatibility)

### Installation

```bash
bun install
```

### Development

Start the development server:

```bash
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

Build for production:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## 🎨 Design Inspiration

This toolbar's animation style is inspired by [agentation](https://github.com/agentation/agentation), featuring:

- **Entrance animations**: Scale + rotation entrance effect
- **Smooth transitions**: Cubic bezier easing curves for natural motion
- **Blur effects**: State transitions with filter blur
- **Tooltip animations**: Delayed appearance with scale effect
- **Button interactions**: Scale-down on active state

## 🏗️ Architecture

### Project Structure

```
cloudflare-toolbar/
├── src/
│   ├── components/
│   │   └── Toolbar/
│   │       ├── index.tsx              # Main toolbar component
│   │       └── Toolbar.module.scss    # SCSS animations & styles
│   ├── App.tsx                        # Demo application
│   ├── main.tsx                       # React entry point
│   └── index.css                      # Global styles
├── index.html                         # HTML entry
├── vite.config.ts                     # Vite configuration
├── package.json
└── README.md
```

### Key Technologies

- **Vite** - Fast build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **SCSS** - CSS with superpowers (variables, nesting, etc.)
- **Bun** - Fast JavaScript runtime and package manager

### Animation System

The toolbar uses pure CSS animations defined in `Toolbar.module.scss`:

- `toolbarEnter` - Initial entrance with scale + rotation
- `scaleIn/scaleOut` - Element appearance/disappearance
- `tooltipIn` - Tooltip fade-in with scale
- Custom transitions - Smooth state changes with cubic-bezier easing

## 🎯 Toolbar Features

### Expand/Collapse

- Click the star icon to expand the toolbar
- Click the X button to collapse it
- Smooth width transition with blur effect

### Drag to Move

- Click and drag the toolbar background (not buttons)
- Constrained to viewport boundaries
- Maintains position between expand/collapse states
- Subtle rotation effect while dragging

### Tooltips

- Hover over buttons to see tooltips
- 850ms delay before appearance
- Arrow pointer aligned to button
- Positioned above buttons by default

## 🔧 Customization

### Adding New Buttons

Edit `src/components/Toolbar/index.tsx`:

```tsx
<div className={styles.buttonWrapper}>
  <button type="button" className={styles.controlButton} title="My Tool">
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
      {/* Your icon SVG */}
    </svg>
  </button>
  <div className={styles.buttonTooltip}>
    My Tool
  </div>
</div>
```

### Changing Colors

Edit `src/components/Toolbar/Toolbar.module.scss`:

```scss
$blue: #3c82f7;   // Accent color
$red: #ff3b30;    // Danger color
$green: #34c759;  // Success color
```

### Animation Timing

Adjust animation durations in `Toolbar.module.scss`:

```scss
.toolbarContainer {
  transition: width 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  
  &.entrance {
    animation: toolbarEnter 0.5s cubic-bezier(0.34, 1.2, 0.64, 1);
  }
}
```

## 📝 Next Steps

This is a foundation for building developer tools. Future enhancements:

- [ ] **Layout Shift Detection** - Detect and visualize CLS events
- [ ] **Interaction Timing (INP)** - Track interaction performance
- [ ] **Accessibility Audit** - Run WCAG compliance checks
- [ ] **Open Graph Preview** - Preview social media cards
- [ ] **Comments System** - Leave feedback on deployments
- [ ] **Cloudflare Integration** - Connect to Workers, KV, D1

See the full feature roadmap in the [original README](./ORIGINAL_README.md).

## 🙏 Credits

- Animation style inspired by [agentation](https://github.com/agentation/agentation)
- Built with [Vite](https://vitejs.dev/), [React](https://react.dev/), and [Bun](https://bun.sh/)

## 📄 License

MIT
