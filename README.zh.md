# MonoCursor

一个轻量、跨框架的自定义光标系统，适用于任何 JS+CSS 技术栈 —— Electron、Tauri、React、Vue、Solid、Next.js、纯 HTML。

指向空白处就是箭头，指向可点击的是圆环，指向可输入的是 I 形光标。每次指针事件只写一次 transform，没有缓动队列，所以和鼠标落在同一帧。

- **静态单例 API** — 随时调用 `MonoCursor.setColor('#f00')`，无需引用
- **激活 / 禁用** — 全局暂停和恢复，不影响 DOM 结构
- **帧同步跟随** — 箭头 + 圆环，一次 transform，没有 will-change
- **三种自动状态** — 箭头 / 圆环 / I 形光标，根据悬停元素自动切换
- **完全可定制** — 颜色、尺寸、阴影、点击反馈、CSS 变量
- **React / Vue / Solid** — 一级 hooks 支持
- **优雅降级** — DevTools、滚动条、粗略指针、减弱动画均可处理
- **零运行时依赖**

---

## 快速开始

### 原生 JS（ESM）

```bash
npm i mono-cursor
```

```js
import { MonoCursor } from 'mono-cursor'

// 启动时初始化一次
MonoCursor.init({ color: '#6366f1', ringSize: 22 })

// 随时更新 — 无需获取实例引用
MonoCursor.setColor('#f59e0b')
MonoCursor.setArrowSize(30)
```

### 浏览器直接引入

```html
<script src="https://unpkg.com/mono-cursor/dist/index.global.js"></script>
<script>
  MonoCursor.init({ color: '#6366f1' })
  MonoCursor.setColor('#f59e0b')
</script>
```

---

## 静态 API（全局单例）

在应用启动时调用一次 `MonoCursor.init()`，之后随时使用静态方法：

```js
// 初始化
MonoCursor.init({ color: '#6366f1', ringSize: 22, shadow: true })

// 运行时更新 — 应用的任何地方都能调用，无需 import
MonoCursor.setColor('#f59e0b')
MonoCursor.setArrowSize(30)
MonoCursor.setRingSize(28)
MonoCursor.setRingBorderWidth(2)
MonoCursor.setShadow(false)          // 关闭投影
MonoCursor.setEnableCircle(false)     // 仅显示箭头
MonoCursor.setClickEffect(false)      // 关闭按下缩放
MonoCursor.setHideDefaultCursor(false) // 显示系统光标

// 系统光标在滚动条拖动期间和 DevTools 元素拣选时会自动恢复 —
// 光标本身永远不会消失或卡在隐藏态

// 激活 / 禁用
MonoCursor.disable()   // 暂停 — 保留 DOM 结构
MonoCursor.enable()    // 恢复

// 一次性更新所有选项
MonoCursor.configure({ color: '#10b981', ringSize: 32 })

// 强制指定状态，直到指针移动到不同内容上
MonoCursor.setState('pointer')   // 'default' | 'pointer' | 'text'

// 完全销毁
MonoCursor.destroy()
```

### `MonoCursor.init(options?)`

创建并注册全局单例。多次调用安全 — 后续调用会合并选项并返回已有实例。

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | `string` | `#6366f1` | 箭头、圆环、I 形光标的颜色 |
| `arrowSize` | `number` | `26` | 箭头宽高（像素） |
| `ringSize` | `number` | `22` | 圆环直径（像素） |
| `ringBorderWidth` | `number` | `1.5` | 圆环描边粗细（像素） |
| `hideDefaultCursor` | `boolean` | `true` | 激活时隐藏系统光标 |
| `enableCircle` | `boolean` | `true` | 绘制圆环 / I 形光标 |
| `shadow` | `boolean` | `true` | 箭头与圆环的投影 |
| `clickEffect` | `boolean` | `true` | 按下时光标缩小 |
| `zIndex` | `number` | `999999` | 光标容器层级 |

---

## 实例 API

用于多光标场景或需要精细控制时：

```js
import { MonoCursor } from 'mono-cursor'

const cursor = new MonoCursor({ color: '#6366f1' }).init()
cursor.setColor('#ff0000')
cursor.setRingSize(28)
cursor.destroy()
```

或使用工厂函数：

```js
import { createCursor } from 'mono-cursor'
const cursor = createCursor({ color: '#6366f1' })
```

---

## HTML 数据属性

在任意元素上通过 `data-cursor` 强制指定光标状态，无需写 JS：

```html
<a data-cursor="pointer">链接</a>
<div data-cursor="circle">一个更大的圆环目标</div>
<div data-cursor="text">强制 I 形光标</div>
<div data-cursor="interactive">任何可点击元素</div>
```

---

## CSS 变量

可在样式表中或运行时覆盖：

```css
:root {
  --mc-color:         #6366f1;
  --mc-stroke:        #ffffff;   /* 箭头轮廓 */
  --mc-arrow-size:    26px;
  --mc-ring-size:     22px;
  --mc-ring-border:   1.5px;
  --mc-z-index:       999999;
}
```

---

## 光标状态

光标会自动检测悬停的元素类型：

| 状态 | 触发条件 | 外观 |
|------|---------|------|
| `default` | 普通元素、正文、死路 | 仅箭头，无圆环 |
| `pointer` | `<a>`、`<button>`、`[role=button]`、`data-cursor="pointer" / "circle" / "interactive"` | 箭头淡出，圆环打开伴随柔和填充 |
| `text` | `<input>`、`<textarea>`、`[contenteditable]` | 箭头淡出，I 形光标出现 |

范围滑块等非文本输入框会显示圆环而不是 I 形光标。

强制指定状态：`MonoCursor.setState('pointer')`。

---

## 工作原理

- 每次指针事件只写一次 `transform`，与系统指针同帧 — 没有 `requestAnimationFrame`，没有 `will-change`，不会有滞后。
- 同时监听 `pointermove` 和 `mousemove`，因此拖动过程中（浏览器捕获指针时）光标仍可跟随。
- 系统光标**仅**在自定义光标绘制时隐藏。在原生滚动条拖动期间（浏览器将其绘制在所有 fixed 元素之上）以及 DevTools 元素拣选时，自动恢复系统指针 — 但自定义光标本身永远不隐藏、不卸载。
- 在 `blur`、鼠标离开视口、滚动、标签页切换时均不隐藏 — 光标不会消失后半天找不见。
- 在粗略指针设备（`pointer: none`）和请求减弱动画的用户上自动跳过，保留原生体验。

---

## 框架集成

### React

```tsx
import { MonoCursorProvider } from 'mono-cursor/react'

export function App() {
  return (
    <MonoCursorProvider color="#6366f1" ringSize={22}>
      <YourApp />
    </MonoCursorProvider>
  )
}

// 树内的任何地方
MonoCursor.setColor('#f59e0b')
```

`useMonoCursor()` hook 返回同样的静态方法，用于命令式控制。

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

开箱即用，支持 ESM 导入或 IIFE 直接引入。

---

## 构建与测试

```bash
npm install
npm run build          // 生成 dist/
npm run test           // 运行 vitest 单元测试
npm run example:dev    // 构建并在 http://localhost:4173 启动 playground
```

示例页引入 `example/mono-cursor.global.js`，`build` 脚本会自动同步它；如果缺失，示例页会显示一行提示。

---

## 浏览器兼容性

支持所有具有 `pointer-events` 的现代浏览器（Chrome 55+、Firefox 59+、Safari 11+、Edge 79+）。会根据 `pointer` 媒体查询和 `prefers-reduced-motion` 做出相应处理。

---

## License

MIT
