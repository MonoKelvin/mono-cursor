# MonoCursor

A tiny, framework-agnostic custom cursor for any JS + CSS stack — Electron, Tauri, React, Vue, Solid, Next.js, plain HTML.

An arrow over empty space, a ring over anything clickable, an I-beam over anything you can type in. One transform write per pointer event — no easing queue — so it lands on the same frame as your mouse.

- **Static singleton API** — `MonoCursor.setColor('#f00')` from anywhere, no refs
- **Enable / Disable** — pause and resume globally without destroying the DOM
- **Frame-perfect tracking** — arrow + ring, one transform per event, no `will-change`
- **Three auto states** — arrow / ring / I-beam, detected from the element under the pointer
- **Fully customizable** — colour, sizing, shadow, press feedback, CSS variables
- **React / Vue / Solid** — first-class hooks
- **Graceful fallbacks** — DevTools, scrollbars, coarse pointers, reduced motion
- **Zero runtime dependencies**

---

## Quick Start

### Vanilla JS (ESM)

```bash
npm i mono-cursor
```

```js
import { MonoCursor } from 'mono-cursor'

// once, at startup
MonoCursor.init({ color: '#6366f1', ringSize: 24 })

// from anywhere — no ref needed
MonoCursor.setColor('#f59e0b')
MonoCursor.setArrowSize(30)
```

### Browser (script tag)

```html
<script src="https://unpkg.com/mono-cursor/dist/index.global.js"></script>
<script>
  MonoCursor.init({ color: '#6366f1' })
  MonoCursor.setColor('#f59e0b')
</script>
```

---

## Static API (Global Singleton)

Call `MonoCursor.init()` once at startup, then use the static setters from anywhere:

```js
// init
MonoCursor.init({ color: '#6366f1', ringSize: 24, shadow: true })

// runtime updates — anywhere in the app, no import needed
MonoCursor.setColor('#f59e0b')
MonoCursor.setArrowSize(30)
MonoCursor.setRingSize(28)
MonoCursor.setRingBorderWidth(2)
MonoCursor.setShadow(false)          // drop the shadow
MonoCursor.setEnableCircle(false)     // arrow only, in every state
MonoCursor.setClickEffect(false)      // no press-down scale
MonoCursor.setHideDefaultCursor(false)

// the system pointer is always restored while a scrollbar is being dragged
// and while DevTools' element picker is active — the cursor itself never hides

// enable / disable
MonoCursor.disable()   // pause — keeps the DOM in place
MonoCursor.enable()    // resume

// replace every option at once
MonoCursor.configure({ color: '#10b981', ringSize: 32 })

// force a state until the pointer reaches different content
MonoCursor.setState('pointer')   // 'default' | 'pointer' | 'text'

// tear down entirely
MonoCursor.destroy()
```

### `MonoCursor.init(options?)`

Creates and registers the global singleton. Safe to call multiple times — later calls merge over earlier options and return the existing instance.

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `color` | `string` | `#6366f1` | Arrow, ring and I-beam colour |
| `arrowSize` | `number` | `26` | Arrow width and height in pixels |
| `ringSize` | `number` | `24` | Ring diameter in pixels |
| `ringBorderWidth` | `number` | `1.8` | Ring stroke thickness in pixels |
| `hideDefaultCursor` | `boolean` | `true` | Hide the native pointer while the cursor is active |
| `enableCircle` | `boolean` | `true` | Draw the ring / I-beam |
| `shadow` | `boolean` | `true` | Drop shadow under the arrow and ring |
| `clickEffect` | `boolean` | `true` | Scale the cursor down while pressed |
| `zIndex` | `number` | `999999` | Z-index of the cursor layer |

---

## Instance API

For multi-cursor scenarios or fine-grained control:

```js
import { MonoCursor } from 'mono-cursor'

const cursor = new MonoCursor({ color: '#6366f1' }).init()
cursor.setColor('#ff0000')
cursor.setRingSize(28)
cursor.destroy()
```

Or use the factory:

```js
import { createCursor } from 'mono-cursor'
const cursor = createCursor({ color: '#6366f1' })
```

---

## Data Attributes

Force a state on any element without writing JS:

```html
<a data-cursor="pointer">Link</a>
<div data-cursor="circle">Ring target</div>
<div data-cursor="text">Force the I-beam</div>
<div data-cursor="interactive">Anything clickable</div>
```

---

## CSS Custom Properties

Override at runtime or in your stylesheet:

```css
:root {
  --mc-color:         #6366f1;
  --mc-stroke:        #ffffff;   /* arrow outline */
  --mc-arrow-size:    26px;
  --mc-ring-size:     24px;
  --mc-ring-border:   1.8px;
  --mc-z-index:       999999;
}
```

---

## Cursor States

The cursor detects the element under the pointer:

| State | Trigger | Appearance |
|-------|---------|------------|
| `default` | Plain elements, prose, dead ends | Arrow only, no ring |
| `pointer` | `<a>`, `<button>`, `[role=button]`, `data-cursor="pointer"` / `"circle"` / `"interactive"` | Arrow fades out, ring opens with a soft fill |
| `text` | `<input>`, `<textarea>`, `[contenteditable]` | Arrow fades out, I-beam appears |

Range sliders and other non-text inputs get the ring, not the I-beam.

Force a state: `MonoCursor.setState('pointer')`.

---

## How it works

- One `transform` write per pointer event, on the same frame — no `requestAnimationFrame` hop, no `will-change`, no interpolation lag behind the system cursor.
- `pointermove` is listened to alongside `mousemove`, so cursor follows during drags where the browser captures the pointer.
- The system cursor is hidden **only** while the custom one is drawn. It is handed back automatically while a native scrollbar is being dragged (the browser paints those above every fixed layer) and while DevTools' element picker is active.
- Never hides on blur, window-leave, scroll or tab-switching — the cursor does not disappear and get stuck invisible.
- Auto-bails on coarse pointers (`pointer: none`) and `prefers-reduced-motion`, so touch users and motion-sensitive users keep their native experience.

---

## Framework Integrations

### React

```tsx
import { MonoCursorProvider } from 'mono-cursor/react'

export function App() {
  return (
    <MonoCursorProvider color="#6366f1" ringSize={24}>
      <YourApp />
    </MonoCursorProvider>
  )
}

// anywhere else in the tree
MonoCursor.setColor('#f59e0b')
```

The `useMonoCursor()` hook returns the same static setters for imperative use.

### Vue 3

```vue
<script setup>
import { useMonoCursor } from 'mono-cursor/vue'

const { setColor, setShadow } = useMonoCursor({ color: '#6366f1' })
</script>
```

### Solid

```tsx
import { useMonoCursor } from 'mono-cursor/solid'

const { setColor } = useMonoCursor({ color: '#6366f1' })
```

### Tauri / Electron

Works out of the box via ESM import or the IIFE build (see script-tag usage above).

---

## Build & Test

```bash
npm install
npm run build          # produces dist/
npm run test           # vitest unit tests
npm run example:dev    # build + serve the playground at http://localhost:4173
```

The demo ships the built IIFE bundle at `example/mono-cursor.global.js`; the `build` script regenerates it, and the playground page shows a one-line warning if it is missing.

---

## Browser Support

All modern browsers with `pointer-events` support (Chrome 55+, Firefox 59+, Safari 11+, Edge 79+). Fine-pointer media-query and `prefers-reduced-motion` are honored.

---

## License

MIT
