# NextConsole

> 新一代前端调试控制台。vConsole 的现代替代品，支持 AI 流式日志、REPL 命令执行、插件系统，专为移动端 H5 和现代 Web 优化。

[English](README.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 特性

- **Console 面板** — 拦截 `console.log/info/warn/error/debug`，支持颜色标记、堆栈追踪、万级日志虚拟列表渲染、搜索过滤、导出
- **AI 流式日志** — 原生支持 SSE 和流式 JSON 输出，通过 `requestAnimationFrame` 批量渲染，高频更新不卡顿
- **Network 面板** — 拦截 `fetch`、`XMLHttpRequest`、`EventSource`（SSE）、`WebSocket`，支持可排序表格、请求/响应详情、耗时统计，SSE/WebSocket 实时消息流（类似浏览器 DevTools 的 Messages 标签页）
- **Storage 面板** — 查看/编辑/删除 `localStorage`、`sessionStorage` 和 Cookie，支持搜索和行内编辑
- **Element 面板** — 可折叠 DOM 树查看器，悬浮高亮元素
- **System 面板** — UA、屏幕信息、设备内存、网络类型、性能指标（FP、FCP、堆内存）
- **REPL 面板** — 在全局作用域执行 JavaScript，支持命令历史（↑/↓）、结果格式化、错误展示
- **插件系统** — 通过简洁的插件 API 扩展自定义面板、样式和逻辑
- **Shadow DOM 隔离** — 无全局 CSS 污染，无 DOM 冲突
- **零依赖** — 纯 TypeScript 实现，不绑定任何框架
- **移动端优先** — 触控优化，可拖拽悬浮按钮带边缘吸附，响应式面板
- **体积小巧** — gzip 后约 18KB

## 快速开始

### CDN / UMD

```html
<script src="https://unpkg.com/@royalscome/nextconsole/dist/nextconsole.umd.js"></script>
<script>
  var nc = new NextConsole();
</script>
```

### ES Module

```bash
npm install @royalscome/nextconsole
```

```js
import NextConsole from '@royalscome/nextconsole';

const nc = new NextConsole({
  defaultTab: 'console',
  panelHeight: 0.4,
});

// 显示/隐藏
nc.show();
nc.hide();
nc.toggle();
```

## AI 流式日志

NextConsole 原生支持 AI/LLM 流式输出：

```js
const nc = new NextConsole();

// 开始流式输出 — 分块实时追加
nc.appendStream('chat-1', '你好');
nc.appendStream('chat-1', '，世界');
nc.appendStream('chat-1', '！');

// 标记流结束
nc.endStream('chat-1');
```

即使面对数千次高频更新，也能通过 `requestAnimationFrame` 批量渲染避免 UI 卡顿。

## 插件系统

通过插件扩展 NextConsole 的功能：

```js
const nc = new NextConsole();

nc.use({
  name: 'my-plugin',
  version: '1.0.0',
  tab: {
    label: '自定义面板',
    render(container, api) {
      container.innerHTML = '<div>Hello from plugin!</div>';
    },
    destroy() { /* 清理逻辑 */ },
  },
  init(api) {
    api.log('插件已加载！');
    api.addStyle('.custom { color: red; }');
  },
  destroy() { /* 清理逻辑 */ },
});
```

`use()` 支持链式调用：

```js
nc.use(pluginA).use(pluginB).use(pluginC);
```

### 插件 API

| 属性 / 方法 | 说明 |
| --- | --- |
| `api.consoleCore` | 访问 Console 核心模块 |
| `api.networkCore` | 访问 Network 核心模块 |
| `api.storageCore` | 访问 Storage 核心模块 |
| `api.addStyle(css)` | 向 Shadow DOM 注入自定义 CSS |
| `api.log(...args)` | 通过 console 打印日志（会被 NextConsole 捕获） |
| `api.show()` | 显示面板 |
| `api.hide()` | 隐藏面板 |

### 插件接口定义

```ts
interface NextConsolePlugin {
  name: string;           // 插件唯一标识（同名插件自动去重）
  version?: string;       // 插件版本号
  tab?: {                 // 可选：自定义面板标签
    label: string;
    render(container: HTMLElement, api: PluginAPI): void;
    destroy?(): void;
  };
  init?(api: PluginAPI): void;    // 安装时调用
  destroy?(): void;               // 销毁时调用
}
```

## 配置项

```ts
interface NextConsoleConfig {
  /** 挂载目标元素（默认：document.body） */
  target?: HTMLElement;
  /** 默认激活的面板标签 */
  defaultTab?: 'console' | 'network' | 'storage' | 'element' | 'system' | 'repl';
  /** 面板初始高度比例 0-1（默认：0.4） */
  panelHeight?: number;
  /** 悬浮按钮初始位置 */
  buttonPosition?: { x: number; y: number };
  /** 主题 */
  theme?: 'dark';
  /** Console 面板配置 */
  console?: {
    maxLogs?: number;      // 默认：10000
    hookConsole?: boolean; // 默认：true
  };
  /** Network 面板配置 */
  network?: {
    maxRequests?: number;      // 默认：500
    hookFetch?: boolean;       // 默认：true
    hookXHR?: boolean;         // 默认：true
    hookSSE?: boolean;         // 默认：true
    hookWebSocket?: boolean;   // 默认：true
  };
  /** Storage 面板配置 */
  storage?: {
    showLocalStorage?: boolean;    // 默认：true
    showSessionStorage?: boolean;  // 默认：true
    showCookies?: boolean;         // 默认：true
  };
  /** NextConsole 初始化完成回调 */
  onReady?: () => void;
}
```

## API

| 方法 | 说明 |
| --- | --- |
| `nc.show()` | 显示面板 |
| `nc.hide()` | 隐藏面板 |
| `nc.toggle()` | 切换面板显隐 |
| `nc.isVisible` | 检查面板是否可见 |
| `nc.appendStream(id, chunk)` | 追加流式日志分块 |
| `nc.endStream(id)` | 标记流结束 |
| `nc.clearConsole()` | 清空所有控制台日志 |
| `nc.clearNetwork()` | 清空所有网络记录 |
| `nc.exportLogs()` | 导出日志为 JSON 字符串 |
| `nc.getLogEntries()` | 获取所有日志条目 |
| `nc.getNetworkEntries()` | 获取所有网络请求条目 |
| `nc.use(plugin)` | 注册插件（支持链式调用） |
| `nc.destroy()` | 销毁并清理所有资源 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npx vite examples

# 启动 SSE/WebSocket 测试服务器（端口 3210）
node examples/server.js

# 生产构建
npm run build

# 类型检查
npm run typecheck
```

测试服务器提供：
- `GET /sse` — SSE 端点，包含 8 种命名事件类型（connected、user_login、order_created 等）
- `GET /sse/ai` — AI 风格流式文本（逐字输出）
- `ws://localhost:3210/ws` — WebSocket，支持推送消息、回声、心跳、get_users 等处理

## 项目结构

```
src/
├── core/              # 核心拦截逻辑
│   ├── console-core.ts    # Console 拦截 & 流式日志
│   ├── network-core.ts    # Fetch/XHR/SSE/WebSocket 拦截
│   ├── storage-core.ts    # Storage 读写
│   ├── element-core.ts    # DOM 树 & 高亮
│   ├── system-core.ts     # 系统信息采集
│   └── repl-core.ts       # JS 命令执行
├── ui/                # UI 组件
│   ├── main-panel.ts      # 面板容器、标签页 & 插件管理
│   ├── float-button.ts    # 可拖拽悬浮按钮
│   ├── console-panel.ts   # Console 标签页（虚拟列表）
│   ├── network-panel.ts   # Network 标签页（可排序表格）
│   ├── storage-panel.ts   # Storage 标签页（增删改查）
│   ├── element-panel.ts   # Element 标签页（DOM 树）
│   ├── system-panel.ts    # System 标签页
│   └── repl-panel.ts      # REPL 标签页（JS 执行）
├── utils/             # 工具函数
│   ├── dom.ts             # DOM 工具
│   ├── json.ts            # JSON 高亮 & 序列化
│   ├── time.ts            # 时间格式化
│   └── event-emitter.ts   # 类型安全的事件发射器
├── styles/
│   └── theme.ts           # CSS 主题（注入 Shadow DOM）
├── types/             # TypeScript 类型定义
│   ├── index.ts
│   ├── console.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── system.ts
│   └── plugin.ts          # 插件系统类型
└── index.ts           # 公共 API 入口
```

## 浏览器支持

- Chrome（移动端 & 桌面端）
- Safari（iOS & macOS）
- Firefox
- Edge

## 许可证

[MIT](LICENSE)
