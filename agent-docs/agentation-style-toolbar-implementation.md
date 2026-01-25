# Agentation-Style Toolbar Implementation

## Overview

Replicated the clean animation style and element selection functionality from [agentation](https://github.com/agentation/agentation) for the Cloudflare Toolbar project.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **SCSS Modules** - Scoped styling with variables
- **Bun** - Package manager and runtime

## Files Created/Modified

### New Files

| File | Purpose |
|------|---------|
| `src/components/Toolbar/index.tsx` | Main toolbar component with selection mode |
| `src/components/Toolbar/Toolbar.module.scss` | All animations and styles |
| `src/components/AnnotationPopup/index.tsx` | Comment input popup |
| `src/components/AnnotationPopup/AnnotationPopup.module.scss` | Popup styles |
| `src/utils/element-identification.ts` | Element naming utilities |
| `src/types.ts` | TypeScript interfaces |
| `vite.config.ts` | Vite configuration |
| `index.html` | HTML entry point |
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Demo application |
| `src/index.css` | Global styles |

### Project Setup

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |

## Features Implemented

### 1. Floating Toolbar

- Pill-style design that expands/collapses
- Draggable positioning with viewport constraints
- Entrance animation with scale + rotation
- Blur effect on expand/collapse transition

### 2. Element Selection Mode

- Toggle via cursor icon button
- Custom cursor (crosshair for elements, text for text content)
- Blue highlight border on hover with scale animation
- Tooltip showing element name follows cursor

### 3. Element Identification

Smart naming for different element types:
- Buttons: `button "Submit"` or `button [aria-label]`
- Links: `link "Click here"` or `link to /path`
- Inputs: `input "placeholder"` or `text input`
- Headings: `h1 "Page Title"`
- Images: `image "alt text"`
- Containers: Uses class names or semantic tags

### 4. Annotation Popup

- Appears on element click
- Shows element name in header
- Displays selected text if any
- Textarea for comment input
- Enter to submit, Escape to cancel
- Shake animation when clicking outside
- Smooth enter/exit animations

### 5. Visual Markers

- Numbered circles at annotation positions
- Scale + bounce entrance animation
- Hover state shows tooltip with:
  - Selected text (if any)
  - Comment text
  - "Click to delete" hint
- Red background on hover (delete indication)
- Scale-down exit animation on delete
- Staggered clear-all animation

### 6. Toolbar Controls

| Button | Function |
|--------|----------|
| Cursor | Toggle selection mode |
| Eye | Toggle marker visibility |
| Trash | Clear all annotations |
| X | Close toolbar |

### 7. Badge Counter

- Shows annotation count when toolbar collapsed
- Bounce entrance animation
- Hidden when toolbar expanded or no annotations

## Animation Keyframes

```scss
@keyframes toolbarEnter      // Scale + rotate entrance
@keyframes badgeEnter        // Badge bounce-in
@keyframes markerIn          // Marker scale-bounce entrance
@keyframes markerOut         // Marker scale-down exit
@keyframes hoverHighlightIn  // Element highlight appearance
@keyframes hoverTooltipIn    // Cursor tooltip slide-in
@keyframes tooltipIn         // Marker tooltip entrance
@keyframes popupEnter        // Popup slide-up entrance
@keyframes popupExit         // Popup slide-down exit
@keyframes shake             // Popup shake effect
@keyframes fadeIn/fadeOut    // Selection outline transitions
```

## CSS Variables

```scss
$blue: #3c82f7;   // Primary accent, active states
$red: #ff3b30;    // Danger, delete states
$green: #34c759;  // Success states (unused currently)
```

## Easing Curves

- **Entrance**: `cubic-bezier(0.34, 1.2, 0.64, 1)` - Bouncy overshoot
- **Smooth**: `cubic-bezier(0.19, 1, 0.22, 1)` - Expo out
- **Marker**: `cubic-bezier(0.22, 1, 0.36, 1)` - Smooth spring

## Usage

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

## How It Works

1. **Selection Mode**: When enabled, adds global CSS for cursors and attaches mousemove/click listeners
2. **Hover Detection**: Uses `document.elementFromPoint()` to find element under cursor
3. **Element Identification**: Analyzes tag, attributes, content to generate readable name
4. **Annotation Storage**: Stores in React state (can be persisted to localStorage)
5. **Marker Positioning**: Uses percentage-based X position and absolute Y position
6. **Fixed Element Handling**: Detects fixed/sticky positioning for correct marker placement

## Future Enhancements

- [ ] Persist annotations to localStorage
- [ ] Multi-select drag to annotate regions
- [ ] Copy annotations as markdown
- [ ] Settings panel (colors, detail level)
- [ ] Edit existing annotations
- [ ] Keyboard shortcuts
