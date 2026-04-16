# NextConsole

> Next-generation front-end debugging console. A modern replacement for vConsole with AI streaming log support, optimized for mobile H5 and modern web.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Features

- **Console Panel** — Hook `console.log/info/warn/error/debug` with color coding, stack traces, virtual list rendering for 10,000+ logs, search/filter, export
- **AI Streaming Logs** — First-class support for SSE and streaming JSON output with buffered real-time UI updates
- **Network Panel** — Intercept `fetch`, `XMLHttpRequest`, `EventSource` (SSE), and `WebSocket` with sortable table, request/response detail, timing, and **real-time message stream** for SSE/WebSocket (like browser DevTools Messages tab)
- **Storage Panel** — View/edit/delete `localStorage`, `sessionStorage`, and cookies with search and inline editing
- **Element Panel** — Collapsible DOM tree viewer with hover-to-highlight
- **System Panel** — UA, screen, device memory, network type, performance metrics (FP, FCP, heap)
- **Shadow DOM Isolation** — No global CSS pollution, no DOM conflicts
- **Zero Dependencies** — Pure vanilla TypeScript, no framework lock-in
- **Mobile-First** — Touch-optimized, draggable float button with edge-snapping, responsive panels
- **Small Bundle** — Target < 40KB minified

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

## Configuration

```ts
interface NextConsoleConfig {
  /** Mount target (default: document.body) */
  target?: HTMLElement;
  /** Default active tab */
  defaultTab?: 'console' | 'network' | 'storage' | 'element' | 'system';
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
│   └── system-core.ts     # System info collection
├── ui/                # UI components
│   ├── main-panel.ts      # Panel shell & tab management
│   ├── float-button.ts    # Draggable float button
│   ├── console-panel.ts   # Console tab (virtual list)
│   ├── network-panel.ts   # Network tab (sortable table)
│   ├── storage-panel.ts   # Storage tab (CRUD)
│   ├── element-panel.ts   # Element tab (DOM tree)
│   └── system-panel.ts    # System tab
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
│   └── system.ts
└── index.ts           # Public API entry point
```

## Browser Support

- Chrome (Mobile & Desktop)
- Safari (iOS & macOS)
- Firefox
- Edge

## License

[MIT](LICENSE)
