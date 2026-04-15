import type { ConsoleOptions } from './console';
import type { NetworkOptions } from './network';
import type { StorageOptions } from './storage';

/** Tab panel types */
export type PanelTab = 'console' | 'network' | 'storage' | 'element' | 'system';

/** NextConsole configuration */
export interface NextConsoleConfig {
  /** Target element to mount to (default: document.body) */
  target?: HTMLElement;
  /** Default active tab */
  defaultTab?: PanelTab;
  /** Initial panel height ratio (0-1) */
  panelHeight?: number;
  /** Float button position */
  buttonPosition?: { x: number; y: number };
  /** Theme: 'dark' only for now */
  theme?: 'dark';
  /** Console panel options */
  console?: Partial<ConsoleOptions>;
  /** Network panel options */
  network?: Partial<NetworkOptions>;
  /** Storage panel options */
  storage?: Partial<StorageOptions>;
  /** Callback when NextConsole is ready */
  onReady?: () => void;
}

/** Event types emitted by NextConsole */
export interface NextConsoleEvents {
  log: (entry: import('./console').LogEntry) => void;
  network: (entry: import('./network').NetworkEntry) => void;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

export type { LogLevel, LogEntry, ConsoleOptions } from './console';
export type { HttpMethod, RequestType, NetworkEntry, SSEEvent, StreamMessage, NetworkOptions } from './network';
export type { StorageType, StorageEntry, StorageOptions } from './storage';
export type { SystemInfo, PerformanceMetrics } from './system';
