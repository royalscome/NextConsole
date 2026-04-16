# NextConsole

> 新一代前端除錯主控台。vConsole 的現代化替代方案，支援 AI 串流日誌、REPL、外掛系統，專為行動端 H5 與現代 Web 最佳化。

[English](README.md) | [简体中文](README.zh-CN.md) | [Français](README.fr.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## 功能特色

- **Console 面板** — 攔截 `console.log/info/warn/error/debug`，支援顏色標示、呼叫堆疊追蹤、虛擬清單渲染（支援 10,000 筆以上日誌）、搜尋/篩選、匯出
- **AI 串流日誌** — 原生支援 SSE 和串流 JSON 輸出，透過緩衝機制實現即時 UI 更新
- **Network 面板** — 攔截 `fetch`、`XMLHttpRequest`、`EventSource`（SSE）和 `WebSocket`，提供可排序表格、請求/回應詳情、計時，以及 SSE/WebSocket 的**即時訊息串流**（類似瀏覽器 DevTools 的 Messages 分頁）
- **Storage 面板** — 檢視/編輯/刪除 `localStorage`、`sessionStorage` 和 Cookie，支援搜尋與行內編輯
- **Element 面板** — 可折疊的 DOM 樹狀檢視器，支援懸停高亮顯示
- **System 面板** — UA、螢幕資訊、裝置記憶體、網路類型、效能指標（FP、FCP、Heap）
- **REPL 面板** — 在全域作用域執行 JavaScript，支援命令歷史（↑/↓）、結果格式化與錯誤顯示
- **外掛系統** — 透過簡潔的外掛 API 為 NextConsole 新增自訂分頁、樣式與邏輯
- **Shadow DOM 隔離** — 無全域 CSS 污染，無 DOM 衝突
- **零依賴** — 純原生 TypeScript，無框架綁定
- **深色 / 淺色主題** — 內建深色和淺色兩套主題，支援透過 `setTheme()` 於執行時動態切換
- **行動端優先** — 觸控最佳化，可拖曳的浮動按鈕支援邊緣吸附，面板響應式設計
- **極小體積** — 約 23KB（gzip，含內建外掛）

## 對比

### 打包體積

| 工具 | 壓縮前 | Gzip 後 | 依賴數 |
| --- | --- | --- | --- |
| **NextConsole** | **99 KB** | **23 KB** | **0** |
| vConsole 3.15 | 277 KB | 76 KB | 4 |
| Eruda 3.4 | 485 KB | 147 KB | 0（已打包） |
| Chii 1.15 | 不適用（伺服器端） | 不適用 | 9 |

NextConsole 比 vConsole **小 3.3 倍**，比 Eruda **小 6.4 倍**（gzip 後）。

### 功能對比

| 功能 | NextConsole | vConsole | Eruda | Chii |
| --- | :---: | :---: | :---: | :---: |
| Console 日誌 | ✅ | ✅ | ✅ | ✅ |
| AI 串流日誌 | ✅ | ❌ | ❌ | ❌ |
| 網路攔截（Fetch） | ✅ | ✅ | ✅ | ✅ |
| 網路攔截（XHR） | ✅ | ✅ | ✅ | ✅ |
| 網路攔截（SSE） | ✅ 即時 | ❌ | ❌ | ✅ |
| 網路攔截（WebSocket） | ✅ 即時 | ❌ | ❌ | ✅ |
| Storage 管理 | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| DOM 元素檢視 | ✅ | ✅ | ✅ | ✅ |
| 系統資訊 | ✅ | ✅ | ✅ | ✅ |
| REPL / JS 執行 | ✅ | ✅ | ✅ | ✅ |
| 效能分析 | ✅ 外掛 | ❌ | ❌ | ✅ |
| 原始碼檢視 | ✅ 外掛 | ❌（第三方） | ✅ | ✅ |
| 外掛系統 | ✅ | ✅ | ✅ | ❌ |
| Shadow DOM 隔離 | ✅ | ❌ | ❌ | 不適用 |
| 零依賴 | ✅ | ❌（4 個依賴） | ✅（已打包） | ❌（9 個依賴） |
| TypeScript 原生支援 | ✅ | ✅ | ✅ | ❌ |
| 深色 / 淺色主題 | ✅ 雙主題 | ✅ 僅深色 | ✅ 雙主題 | ✅ 僅深色 |
| 行動端最佳化 | ✅ | ✅ | ✅ | ❌ |
| 遠端除錯 | ❌ | ❌ | ❌ | ✅ |
| 最後更新 | 2026 | 2023 | 2025 | 2025 |

### 架構對比

| 面向 | NextConsole | vConsole | Eruda | Chii |
| --- | --- | --- | --- | --- |
| 渲染方式 | Shadow DOM | body 內 `<div>` | body 內 `<div>` | Chrome DevTools |
| CSS 隔離 | 完整（Shadow DOM） | 作用域 class | 作用域 class | iframe |
| 打包格式 | ES + UMD | UMD | UMD | 伺服器 + 客戶端 |
| 框架 | 無 | 無 | 無 | Node.js 伺服器 |
| 日誌渲染 | 虛擬清單（10K+） | DOM 追加 | DOM 追加 | DevTools 原生 |
| 串流處理 | RAF 批次更新 | 不支援 | 不支援 | 不支援 |

## 快速開始

### CDN / UMD

```html
<script src="https://unpkg.com/@royalscome/nextconsole/dist/nextconsole.umd.js"></script>
<script>
  var nc = new NextConsole();
</script>
```

### ES 模組

```bash
npm install @royalscome/nextconsole
```

```js
import NextConsole from '@royalscome/nextconsole';

const nc = new NextConsole({
  defaultTab: 'console',
  panelHeight: 0.4,
  theme: 'light', // 'dark'（預設）或 'light'
});

// 顯示/隱藏
nc.show();
nc.hide();

// 執行時切換主題
nc.setTheme('dark');
nc.setTheme('light');
nc.toggle();
```

## AI 串流日誌

NextConsole 原生支援 AI/LLM 串流輸出：

```js
const nc = new NextConsole();

// 開始串流 — 資料片段即時追加
nc.appendStream('chat-1', 'Hello ');
nc.appendStream('chat-1', 'from ');
nc.appendStream('chat-1', 'AI!');

// 標記串流結束
nc.endStream('chat-1');
```

透過 `requestAnimationFrame` 批次渲染，即使有數千次快速更新也不會造成 UI 卡頓。

## 外掛系統

使用自訂面板和邏輯擴充 NextConsole：

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
    destroy() { /* 清理邏輯 */ },
  },
  init(api) {
    api.log('Plugin loaded!');
    api.addStyle('.custom { color: red; }');
  },
  destroy() { /* 清理邏輯 */ },
});
```

### 外掛 API

| 屬性 / 方法 | 說明 |
| --- | --- |
| `api.consoleCore` | 存取 Console 核心模組 |
| `api.networkCore` | 存取 Network 核心模組 |
| `api.storageCore` | 存取 Storage 核心模組 |
| `api.addStyle(css)` | 向 Shadow DOM 注入自訂 CSS |
| `api.log(...args)` | 透過主控台輸出訊息 |
| `api.show()` | 顯示面板 |
| `api.hide()` | 隱藏面板 |

### 外掛介面

```ts
interface NextConsolePlugin {
  name: string;           // 唯一外掛名稱
  version?: string;       // 外掛版本
  tab?: {                 // 可選的自訂分頁
    label: string;
    render(container: HTMLElement, api: PluginAPI): void;
    destroy?(): void;
  };
  init?(api: PluginAPI): void;    // 安裝時呼叫
  destroy?(): void;               // 清理時呼叫
}
```

### 內建外掛

NextConsole 內建兩個官方外掛：

#### Source 外掛

檢視頁面所有指令碼和樣式表（外部及行內），提供完整原始碼檢視器：

```js
import NextConsole, { createSourcePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createSourcePlugin());
```

#### Performance 外掛

Core Web Vitals、資源明細、長任務偵測，以及自訂效能標記：

```js
import NextConsole, { createPerformancePlugin } from '@royalscome/nextconsole';

const nc = new NextConsole();
nc.use(createPerformancePlugin());
```

## 設定選項

```ts
interface NextConsoleConfig {
  /** 掛載目標（預設：document.body） */
  target?: HTMLElement;
  /** 預設啟用的分頁 */
  defaultTab?: 'console' | 'network' | 'storage' | 'element' | 'system' | 'repl';
  /** 初始面板高度比例 0-1（預設：0.4） */
  panelHeight?: number;
  /** 浮動按鈕初始位置 */
  buttonPosition?: { x: number; y: number };
  /** 主題 */
  theme?: 'dark' | 'light';  // 預設：'dark'
  /** Console 選項 */
  console?: {
    maxLogs?: number;      // 預設：10000
    hookConsole?: boolean; // 預設：true
  };
  /** Network 選項 */
  network?: {
    maxRequests?: number;      // 預設：500
    hookFetch?: boolean;       // 預設：true
    hookXHR?: boolean;         // 預設：true
    hookSSE?: boolean;         // 預設：true
    hookWebSocket?: boolean;   // 預設：true
  };
  /** Storage 選項 */
  storage?: {
    showLocalStorage?: boolean;    // 預設：true
    showSessionStorage?: boolean;  // 預設：true
    showCookies?: boolean;         // 預設：true
  };
  /** NextConsole 就緒後的回呼函式 */
  onReady?: () => void;
}
```

## API

| 方法 | 說明 |
| --- | --- |
| `nc.show()` | 顯示面板 |
| `nc.hide()` | 隱藏面板 |
| `nc.toggle()` | 切換面板顯示狀態 |
| `nc.isVisible` | 檢查面板是否可見 |
| `nc.setTheme(theme)` | 切換主題（`'dark'` 或 `'light'`） |
| `nc.appendStream(id, chunk)` | 向串流日誌追加資料片段 |
| `nc.endStream(id)` | 標記串流結束 |
| `nc.clearConsole()` | 清除所有 Console 日誌 |
| `nc.clearNetwork()` | 清除所有 Network 記錄 |
| `nc.exportLogs()` | 將日誌匯出為 JSON 字串 |
| `nc.getLogEntries()` | 取得所有日誌條目 |
| `nc.getNetworkEntries()` | 取得所有網路記錄 |
| `nc.use(plugin)` | 註冊外掛（支援鏈式呼叫） |
| `nc.destroy()` | 銷毀並清理所有資源 |

## 開發

```bash
# 安裝依賴
npm install

# 啟動帶有示範的開發伺服器
npx vite examples

# 啟動 SSE/WebSocket 測試伺服器（埠 3210）
node examples/server.js

# 建置生產版本
npm run build

# 型別檢查
npm run typecheck
```

測試伺服器提供：
- `GET /sse` — SSE 端點，包含 8 種命名事件類型（connected、user_login、order_created 等）
- `GET /sse/ai` — AI 風格的逐字元串流文字
- `ws://localhost:3210/ws` — WebSocket，支援推送訊息、echo、ping 及 get_users 處理器

## 專案結構

```
src/
├── core/              # 核心攔截邏輯
│   ├── console-core.ts    # Console 攔截與串流
│   ├── network-core.ts    # Fetch/XHR/SSE/WebSocket 攔截
│   ├── storage-core.ts    # Storage 讀寫
│   ├── element-core.ts    # DOM 樹與高亮
│   ├── system-core.ts     # 系統資訊收集
│   └── repl-core.ts       # JS 命令執行
├── ui/                # UI 元件
│   ├── main-panel.ts      # 面板主體、分頁與外掛管理
│   ├── float-button.ts    # 可拖曳浮動按鈕
│   ├── console-panel.ts   # Console 分頁（虛擬清單）
│   ├── network-panel.ts   # Network 分頁（可排序表格）
│   ├── storage-panel.ts   # Storage 分頁（CRUD）
│   ├── element-panel.ts   # Element 分頁（DOM 樹）
│   ├── system-panel.ts    # System 分頁
│   └── repl-panel.ts      # REPL 分頁（JS 執行）
├── utils/             # 工具函式
│   ├── dom.ts             # DOM 工具
│   ├── json.ts            # JSON 高亮與序列化
│   ├── time.ts            # 時間格式化
│   └── event-emitter.ts   # 型別化事件發射器
├── styles/
│   └── theme.ts           # CSS 主題（注入 Shadow DOM）
├── types/             # TypeScript 介面定義
│   ├── index.ts
│   ├── console.ts
│   ├── network.ts
│   ├── storage.ts
│   ├── system.ts
│   └── plugin.ts          # 外掛系統型別
├── plugins/           # 內建外掛
│   ├── index.ts
│   ├── source-plugin.ts   # 原始碼檢視器
│   └── performance-plugin.ts  # 效能分析
└── index.ts           # 公開 API 入口
```

## 瀏覽器支援

- Chrome（行動端 & 桌面端）
- Safari（iOS & macOS）
- Firefox
- Edge

## 授權

[MIT](LICENSE)
