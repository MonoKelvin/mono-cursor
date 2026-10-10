# MonoCursor

A tiny, framework-agnostic custom cursor system for any JS+CSS stack — Electron, Tauri, React, Vue, Solid, Next.js, and more.

- **Static singleton API** — `MonoCursor.setColor('#f00')` anywhere, no refs needed
- **Enable / Disable** — pause and resume globally without destroying the DOM
- **Smooth lerp animation** — dot + ring, GPU-accelerated
- **Auto state detection** — switches shape on links, inputs, text fields, custom elements
- **Fully customizable** — color, size, lerp, ring, animations
- **React / Vue / Solid** — first-class hooks
- **Zero runtime dependencies**

---

## Quick Start

### Vanilla JS (ESM)

```bash
npm install mono-cursor
```

```js
import { MonoCursor } from 'mono-cursor'

// Initialize once at app startup
MonoCursor.init({ color: '#6366f1' })

// Update anywhere — no ref needed
MonoCursor.setColor('#f59e0b')
MonoCursor.setDotSize(12)
```

### Browser (script tag)

```html
<script src="https://unpkg.com/mono-cursor/dist/index.iife.js"></script>
<script>
  MonoCursor.init({ color: '#6366f1' })
  MonoCursor.setColor('#f59e0b')
</script>
```

---

## Static API (Global Singleton)

Call `MonoCursor.init()` once at startup, then use the static setters anywhere:

```js
// Init
MonoCursor.init({ color: '#6366f1', ringSize: 50, lerpFactor: 0.15 })

// Runtime updates — anywhere, no import needed
MonoCursor.setColor('#f59e0b')
MonoCursor.setDotSize(12)
MonoCursor.setRingSize(60)
MonoCursor.setRingBorderWidth(2)
MonoCursor.setLerpFactor(0.08)       // lower = smoother
MonoCursor.setEnableCircle(false)     // dot only
MonoCursor.setHideDefaultCursor(false)

// Enable / Disable
MonoCursor.disable()   // pause — keeps DOM in place
MonoCursor.enable()   // resume

// Replace all options at once
MonoCursor.configure({ color: '#10b981', ringSize: 40 })

// Destroy
MonoCursor.destroy()
```

### `MonoCursor.init(options?)`

Creates and registers the global singleton. Safe to call multiple times — returns the existing instance on subsequent calls.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | `#6366f1` | Primary cursor color |
| `dotSize` | `number` | `8` | Center dot diameter in pixels |
| `ringSize` | `number` | `40` | Outer ring diameter in pixels |
| `ringBorderWidth` | `number` | `1.5` | Ring border thickness in pixels |
| `lerpFactor` | `number` | `0.15` | Smoothing: 0.01 = smooth/slow, 1 = instant |
| `hideDefaultCursor` | `boolean` | `true` | Hide the system cursor |
| `enableCircle` | `boolean` | `true` | Show the outer ring |
| `zIndex` | `number` | `999999` | Z-index of the cursor |

---

## Instance API

For multi-cursor scenarios or fine-grained control:

```js
import { MonoCursor } from 'mono-cursor'

const cursor = new MonoCursor({ color: '#6366f1' }).init()
cursor.setColor('#ff0000')
cursor.setRingSize(60)
cursor.destroy()
```

Or use the factory:

```js
import { createCursor } from 'mono-cursor'

const cursor = createCursor({ color: '#6366f1' })
```

---

## Data Attributes

Force a specific cursor state on any element:

```html
<a data-cursor="pointer">Link</a>
<div data-cursor="circle">Special area</div>
<div data-cursor="text">Text-like</div>
<div data-cursor="interactive">Default interactive</div>
```

---

## CSS Custom Properties

Override at runtime or in your stylesheet:

```css
:root {
  --mc-color: #6366f1;
  --mc-dot-size: 8px;
  --mc-ring-size: 40px;
  --mc-ring-border: 1.5px;
  --mc-z-index: 999999;
}
```

---

## Cursor States

The cursor automatically detects what it's hovering over:

| State | Trigger | Ring appearance |
|-------|---------|----------------|
| `default` | Plain elements | Subtle semi-transparent ring |
| `pointer` | `<a>`, `<button>`, `data-cursor="pointer"` | Slightly larger, more opaque |
| `text` | `<input>`, `<textarea>` | Vertical I-beam line |
| `circle` | `data-cursor="circle"` | Large, soft circle |

Force a state: `MonoCursor.setState('circle')`

---

## Framework Integrations

### React

```tsx
import { MonoCursorProvider } from 'mono-cursor/react'

function App() {
  return (
    <MonoCursorProvider color="#6366f1" ringSize={50}>
      <YourApp />
    </MonoCursorProvider>
  )
}
```

Hook for imperative control:

```tsx
import { useMonoCursor } from 'mono-cursor/react'

function Controls() {
  const { setColor } = useMonoCursor()
  return <button onClick={() => setColor('#f59e0b')}>Turn orange</button>
}
```

### Vue 3

```vue
<script setup>
import { useMonoCursor } from 'mono-cursor/vue'

const { setColor } = useMonoCursor({ color: '#6366f1' })
</script>
```

### Solid

```tsx
import { useMonoCursor } from 'mono-cursor/solid'

const { setColor } = useMonoCursor({ color: '#6366f1' })
```

### Tauri / Electron

Works out of the box. Import via ESM or use the IIFE script tag.

---

## Build & Test

```bash
npm install
npm run build    # produces dist/
npm run test     # vitest unit tests
npm run example:dev  # serve demo at http://localhost:3000
```

---

## Browser Support

All modern browsers with `pointer-events` support (Chrome 55+, Firefox 59+, Safari 11+, Edge 79+).

---

## License

MIT
