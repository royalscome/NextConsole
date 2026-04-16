# NextConsole

> Next-generation front-end debugging console. A modern replacement for vConsole with AI streaming log support, REPL, plugin system, optimized for mobile H5 and modern web.

[中文文档](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Console Panel** — Hook `console.log/info/warn/error/debug` with color coding, stack traces, virtual list rendering for 10,000+ logs, search/filter, export
- **AI Streaming Logs** — First-class support for SSE and streaming JSON output with buffered real-time UI updates
- **Network Panel** — Intercept `fetch`, `XMLHttpRequest`, `EventSource` (SSE), and `WebSocket` with sortable table, request/response detail, timing, and **real-time message stream** for SSE/WebSocket (like browser DevTools Messages tab)
- **Storage Panel** — View/edit/delete `localStorage`, `sessionStorage`, and cookies with search and inline editing
- **Element Panel** — Collapsible DOM tree viewer with hover-to-highlight
- **System Panel** — UA, screen, device memory, network type, performance metrics (FP, FCP, heap)
- **REPL Panel** — Execute JavaScript in global scope with command history (↑/↓), result formatting, and error display
- **Plugin System** — Extend NextConsole with custom tabs, styles, and logic via a simple plugin API
- **Shadow DOM Isolation** — No global CSS pollution, no DOM conflicts
- **Zero Dependencies** — Pure vanilla TypeScript, no framework lock-in
- **Mobile-First** — Touch-optimized, draggable float button with edge-snapping, responsive panels
- **Small Bundle** — ~22KB gzipped (with built-in plugins)

## Comparison

### Bundle Size

| Tool | Minified | Gzipped | Dependencies |
| --- | --- | --- | --- |
| **NextConsole** | **97 KB** | **22 KB** | **0** |
| vConsole 3.15 | 277 KB | 76 KB | 4 |
| Eruda 3.4 | 485 KB | 147 KB | 0 (bundled) |
| Chii 1.15 | N/A (server) | N/A | 9 |

NextConsole is **3.5x smaller** than vConsole and **6.7x smaller** than Eruda (gzipped).

### Feature Comparison

| Feature | NextConsole | vConsole | Eruda | Chii |
| --- | :---: | :---: | :---: | :---: |
| Console Log | ✅ | ✅ | ✅ | ✅ |
| AI Streaming Log | ✅ | ❌ | ❌ | ❌ |
| Network (Fetch) | ✅ | ✅ | ✅ | ✅ |
| Network (XHR) | ✅ | ✅ | ✅ | ✅ |
| Network (SSE) | ✅ Real-time | ❌ | ❌ | ✅ |
| Network (WebSocket) | ✅ Real-time | ❌ | ❌ | ✅ |
| Storage | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| DOM Element | ✅ | ✅ | ✅ | ✅ |
| System Info | ✅ | ✅ | ✅ | ✅ |
| REPL / JS Execute | ✅ | ✅ | ✅ | ✅ |
| Performance Profiling | ✅ Plugin | ❌ | ❌ | ✅ |
| Source Viewer | ✅ Plugin | ❌ (3rd party) | ✅ | ✅ |
| Plugin System | ✅ | ✅ | ✅ | ❌ |
| Shadow DOM Isolation | ✅ | ❌ | ❌ | N/A |
| Zero Dependencies | ✅ | ❌ (4 deps) | ✅ (bundled) | ❌ (9 deps) |
| TypeScript Native | ✅ | ✅ | ✅ | ❌ |
| Dark Theme | ✅ | ✅ | ✅ | ✅ |
| Mobile Optimized | ✅ | ✅ | ✅ | ❌ |
| Remote Debugging | ❌ | ❌ | ❌ | ✅ |
| Last Updated | 2026 | 2023 | 2025 | 2025 |

### Architecture

| Aspect | NextConsole | vConsole | Eruda | Chii |
| --- | --- | --- | --- | --- |
| Rendering | Shadow DOM | `<div>` in body | `<div>` in body | Chrome DevTools |
| CSS Isolation | Full (Shadow DOM) | Scoped class | Scoped class | iframe |
| Build Format | ES + UMD | UMD | UMD | Server + Client |
| Framework | None | None | None | Node.js server |
| Log Rendering | Virtual List (10K+) | DOM append | DOM append | DevTools native |
| Streaming | RAF batch | N/A | N/A | N/A |

## Quick Start

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

// Show/hide
nc.show();
nc.hide();
nc.toggle();
```

## AI Streaming Logs

NextConsole has first-class support for AI/LLM streaming output:

```js
const nc = new NextConsole();

// Start streaming — chunks are appended in real-time
nc.appendStream('chat-1', 'Hello ');
nc.appendStream('chat-1', 'from ');
nc.appendStream('chat-1', 'AI!');

// Mark stream as complete
nc.endStream('chat-1');
```

This avoids UI freezes even with thousands of rapid updates by batching renders via `requestAnimationFrame`.

## Plugin System

Extend NextConsole with custom panels and logic:

```js
const nc = new NextConsole();

nc.use({
  name: 'my-plugin',
  version: '1.0.0',
  tab: {
    label: 'My Tab',
    render(container, api) {
      container.innerHTML = '<div>Hello from plugin!</div>';
    },
    destroy() { /* cleanup */ },
  },
  init(api) {
    api.log('Plugin loaded!');
    api.addStyle('.custom { color: red; }');
  },
  destroy() { /* cleanup */ },
});
```

### Plugin API

| Property / Method | Description |
| --- | --- |
| `api.consoleCore` | Access to the console core module |
| `api.networkCore` | Access to the network core module |
| `api.storageCore` | Access to the storage core module |
| `api.addStyle(css)` | Inject custom CSS into the Shadow DOM |
| `api.log(...args)` | Log messages through the console |
| `api.show()` | Show the panel |
| `api.hide()` | Hide the panel |

### Plugin Interface

```ts
interface NextConsolePlugin {
  name: string;           // Unique plugin name
  version?: string;       // Plugin version
  tab?: {                 // Optional custom tab
    label: string;
    render(container: HTMLElement, api: PluginAPI): void;
    destroy?(): void;
  };
  init?(api: PluginAPI): void;    // Called on install
  destroy?(): void;               // Called on cleanup
}
```

### Built-in Plugins

NextConsole ships with two official plugins:

#### Source Plugin

View all page scripts and stylesheets (external & inline) with full source code viewer:

```js
import NextConsole, { createSourcePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createSourcePlugin());
```

#### Performance Plugin

Core Web Vitals, resource breakdown, long task detection, and custom performance marks:

```js
import NextConsole, { createPerformancePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createPerformancePlugin());
```

## Configuration

```ts
interface NextConsoleConfig {
  /** Mount target (default: document.body) */
  target?: HTMLElement;
  /** Default active tab */
  defaultTab?: 'console' | 'network' | 'storage' | 'element' | 'system' | 'repl';
  /** Initial panel height ratio 0-1 (default: 0.4) */
  panelHeight?: number;
  /** Float button initial position */
  buttonPosition?: { x: number; y: number };
  /** Theme */
  theme?: 'dark';
  /** Console options */
  console?: {
    maxLogs?: number;      // default: 10000
    hookConsole?: boolean; // default: true
  };
  /** Network options */
  network?: {
    maxRequests?: number;      // default: 500
    hookFetch?: boolean;       // default: true
    hookXHR?: boolean;         // default: true
    hookSSE?: boolean;         // default: true
    hookWebSocket?: boolean;   // default: true
  };
  /** Storage options */
  storage?: {
    showLocalStorage?: boolean;    // default: true
    showSessionStorage?: boolean;  // default: true
    showCookies?: boolean;         // default: true
  };
  /** Called when NextConsole is ready */
  onReady?: () => void;
}
```

## API

| Method | Description |
| --- | --- |
| `nc.show()` | Show the panel |
| `nc.hide()` | Hide the panel |
| `nc.toggle()` | Toggle panel visibility |
| `nc.isVisible` | Check if panel is visible |
| `nc.appendStream(id, chunk)` | Append chunk to a streaming log |
| `nc.endStream(id)` | Mark a stream as complete |
| `nc.clearConsole()` | Clear all console logs |
| `nc.clearNetwork()` | Clear all network entries |
| `nc.exportLogs()` | Export logs as JSON string |
| `nc.getLogEntries()` | Get all log entries |
| `nc.getNetworkEntries()` | Get all network entries |
| `nc.use(plugin)` | Register a plugin (chainable) |
| `nc.destroy()` | Destroy and clean up everything |

## Development

```bash
# Install dependencies
npm install

# Start dev server with demo
npx vite examples

# Start SSE/WebSocket test server (port 3210)
node examples/server.js

# Build for production
npm run build

# Type check
npm run typecheck
```

The test server provides:
- `GET /sse` — SSE endpoint with 8 named event types (connected, user_login, order_created, etc.)
- `GET /sse/ai` — AI-style streaming text (char by char)
- `ws://localhost:3210/ws` — WebSocket with push messages, echo, ping, and get_users handlers

## Project Structure

```
src/
├── core/              # Core interceptor logic
│   ├── console-core.ts    # Console hooking & streaming
│   ├── network-core.ts    # Fetch/XHR/SSE/WebSocket interception
│   ├── storage-core.ts    # Storage read/write
│   ├── element-core.ts    # DOM tree & highlight
│   ├── system-core.ts     # System info collection
│   └── repl-core.ts       # JS command execution
├── ui/                # UI components
│   ├── main-panel.ts      # Panel shell, tabs & plugin management
│   ├── float-button.ts    # Draggable float button
│   ├── console-panel.ts   # Console tab (virtual list)
│   ├── network-panel.ts   # Network tab (sortable table)
│   ├── storage-panel.ts   # Storage tab (CRUD)
│   ├── element-panel.ts   # Element tab (DOM tree)
│   ├── system-panel.ts    # System tab
│   └── repl-panel.ts      # REPL tab (JS execution)
├── utils/             # Helpers
│   ├── dom.ts             # DOM utilities
│   ├── json.ts            # JSON highlighting & stringify
│   ├── time.ts            # Time formatting
│   └── event-emitter.ts   # Typed event emitter
├── styles/
│   └── theme.ts           # CSS theme (injected into Shadow DOM)
├── types/             # TypeScript interfaces
│   ├── index.ts
│   ├── console.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── system.ts
│   └── plugin.ts          # Plugin system types
├── plugins/           # Built-in plugins
│   ├── index.ts
│   ├── source-plugin.ts   # Source code viewer
│   └── performance-plugin.ts  # Performance profiling
└── index.ts           # Public API entry point
```

## Browser Support

- Chrome (Mobile & Desktop)
- Safari (iOS & macOS)
- Firefox
- Edge

## License

[MIT](LICENSE)
