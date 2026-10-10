# MonoCursor

一个轻量、跨框架的自定义光标系统，适用于任何 JS+CSS 技术栈——Electron、Tauri、React、Vue、Solid、Next.js 等。

- **静态单例 API** — 随时调用 `MonoCursor.setColor('#f00')`，无需引用
- **激活 / 禁用** — 全局暂停和恢复，不影响 DOM 结构
- **平滑插值动画** — 圆点 + 圆圈，GPU 加速
- **自动状态检测** — 根据悬停元素自动切换形状（链接、输入框、自定义元素）
- **完全可定制** — 颜色、大小、平滑度、圆圈开关
- **React / Vue / Solid** — 一级 hooks 支持
- **零运行时依赖**

---

## 快速开始

### 原生 JS（ESM）

```bash
npm install mono-cursor
```

```js
import { MonoCursor } from 'mono-cursor'

// 应用启动时初始化一次
MonoCursor.init({ color: '#6366f1' })

// 随时更新 — 无需获取实例引用
MonoCursor.setColor('#f59e0b')
MonoCursor.setDotSize(12)
```

### 浏览器直接引入

```html
<script src="https://unpkg.com/mono-cursor/dist/index.iife.js"></script>
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
MonoCursor.init({ color: '#6366f1', ringSize: 50, lerpFactor: 0.15 })

// 运行时更新
MonoCursor.setColor('#f59e0b')           // 颜色
MonoCursor.setDotSize(12)                // 圆点大小
MonoCursor.setRingSize(60)               // 圆圈大小
MonoCursor.setRingBorderWidth(2)          // 圆圈边框宽度
MonoCursor.setLerpFactor(0.08)           // 平滑度（越小越平滑）
MonoCursor.setEnableCircle(false)         // 仅显示圆点
MonoCursor.setHideDefaultCursor(false)    // 显示系统光标

// 激活 / 禁用
MonoCursor.disable()   // 暂停 — 保留 DOM 结构
MonoCursor.enable()     // 恢复

// 一次性更新所有选项
MonoCursor.configure({ color: '#10b981', ringSize: 40 })

// 销毁
MonoCursor.destroy()
```

### `MonoCursor.init(options?)`

创建并注册全局单例。多次调用安全 — 后续调用返回已有实例。

### 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `color` | `string` | `#6366f1` | 光标主颜色 |
| `dotSize` | `number` | `8` | 中心圆点直径（像素） |
| `ringSize` | `number` | `40` | 外圈直径（像素） |
| `ringBorderWidth` | `number` | `1.5` | 圆圈边框宽度（像素） |
| `lerpFactor` | `number` | `0.15` | 平滑系数：0.01 = 柔滑，1 = 即时 |
| `hideDefaultCursor` | `boolean` | `true` | 隐藏系统光标 |
| `enableCircle` | `boolean` | `true` | 启用外圈效果 |
| `zIndex` | `number` | `999999` | 光标容器层级 |

---

## 实例 API

用于多光标场景或需要精细控制时：

```js
import { MonoCursor } from 'mono-cursor'

const cursor = new MonoCursor({ color: '#6366f1' }).init()
cursor.setColor('#ff0000')
cursor.setRingSize(60)
cursor.destroy()
```

或使用工厂函数：

```js
import { createCursor } from 'mono-cursor'
const cursor = createCursor({ color: '#6366f1' })
```

---

## HTML 数据属性

在任意元素上使用 `data-cursor` 强制指定光标状态：

```html
<a data-cursor="pointer">链接</a>
<div data-cursor="circle">特殊区域</div>
<div data-cursor="text">文本模式</div>
<div data-cursor="interactive">默认交互</div>
```

---

## CSS 变量

可在样式表中或运行时覆盖：

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

## 光标状态

光标自动检测悬停的元素类型：

| 状态 | 触发条件 | 圆圈外观 |
|------|---------|---------|
| `default` | 普通元素、空区域 | 半透明细圆圈 |
| `pointer` | `<a>`、`<button>`、`data-cursor="pointer"` | 稍大、更不透明 |
| `text` | `<input>`、`<textarea>` | 垂直 I 型光标线 |
| `circle` | `data-cursor="circle"` | 大而柔和的圆圈 |

强制指定状态：`MonoCursor.setState('circle')`

---

## 框架集成

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

使用 hook 进行命令式控制：

```tsx
import { useMonoCursor } from 'mono-cursor/react'

function Controls() {
  const { setColor } = useMonoCursor()
  return <button onClick={() => setColor('#f59e0b')}>变为橙色</button>
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

开箱即用，支持 ESM 导入或 IIFE 直接引入。

---

## 构建与测试

```bash
npm install
npm run build    # 生成 dist/
npm run test     # 运行 vitest 单元测试
npm run example:dev  # 在 http://localhost:3000 启动示例
```

---

## 浏览器兼容性

支持所有主流现代浏览器（Chrome 55+、Firefox 59+、Safari 11+、Edge 79+）。

---

## License

MIT
